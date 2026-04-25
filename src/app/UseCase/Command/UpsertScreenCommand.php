<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\UpsertScreenRequest;
use App\DTO\Response\ScreenResponse;
use App\Exceptions\ScreenNotFoundException;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\Screen;
use App\Models\User;
use App\Models\WorkflowRevision;
use App\Services\Audit\AuditLogger;
use App\Services\Screen\ScreenImageService;
use Throwable;

final class UpsertScreenCommand
{
    public function __construct(
        private readonly ScreenImageService $imageService,
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, WorkflowRevision $workflowRevision, UpsertScreenRequest $request): ScreenResponse
    {
        abort_if($workflowRevision->is_published, 422, 'Cannot modify a published revision.');

        $newImagePath = null;
        $previousImagePath = null;

        try
        {
            $screen = $this->transactionManager->transactional(function () use (
                $actor,
                $workflowRevision,
                $request,
                &$newImagePath,
                &$previousImagePath,
            ): Screen {
                $screen = Screen::query()->firstOrCreate(
                    [
                        'workflow_revision_id' => $workflowRevision->id,
                        'node_id'              => $request->nodeId,
                    ],
                    [
                        'created_by' => $actor->id,
                    ],
                );

                $imagePath = $screen->image_path;
                if ($request->image !== null)
                {
                    $previousImagePath = $screen->image_path;
                    $newImagePath = $this->imageService->storeResized($request->image);
                    $imagePath = $newImagePath;
                }

                $screen->update([
                    'title' => $request->hasTitle
                        ? $request->title
                        : $screen->title,
                    'subtitle' => $request->hasSubtitle
                        ? $request->subtitle
                        : $screen->subtitle,
                    'description' => $request->hasDescription
                        ? $request->description
                        : $screen->description,
                    'image_path' => $imagePath,
                    'updated_by' => $actor->id,
                ]);

                AuditLogger::log($actor, $screen, 'updated', 'Screen upserted');

                $screen = $screen->fresh(['customFields']);
                if (! $screen instanceof Screen)
                {
                    throw new ScreenNotFoundException('Screen not found after upsert.');
                }

                return $screen;
            });
        }
        catch (Throwable $exception)
        {
            $this->imageService->delete($newImagePath);

            throw $exception;
        }

        if ($newImagePath !== null)
        {
            $this->imageService->delete($previousImagePath);
        }

        return ScreenResponse::fromModel($screen);
    }
}
