<?php

namespace App\Actions;

use App\DTO\Command\UpdateScreenCommand;
use App\DTO\Command\UpsertScreenCommand;
use App\Models\Screen;
use App\Models\User;
use App\Models\WorkflowVersion;
use App\Services\Audit\AuditLogger;
use App\Services\Screen\ScreenImageService;
use Illuminate\Support\Facades\DB;
use Throwable;

final class ScreenActionService
{
    public function __construct(private readonly ScreenImageService $imageService) {}

    public function upsert(User $actor, WorkflowVersion $workflowVersion, UpsertScreenCommand $command): Screen
    {
        abort_if($workflowVersion->is_published, 422, 'Cannot modify a published revision.');

        $newImagePath = null;
        $previousImagePath = null;

        try {
            $screen = DB::transaction(function () use (
                $actor,
                $workflowVersion,
                $command,
                &$newImagePath,
                &$previousImagePath
            ): Screen {
                $screen = Screen::query()->firstOrCreate(
                    [
                        'workflow_version_id' => $workflowVersion->id,
                        'node_id' => $command->nodeId,
                    ],
                    [
                        'created_by' => $actor->id,
                    ]
                );

                $imagePath = $screen->image_path;
                if ($command->image !== null) {
                    $previousImagePath = $screen->image_path;
                    $newImagePath = $this->imageService->storeResized($command->image);
                    $imagePath = $newImagePath;
                }

                $screen->update([
                    'title' => $command->hasTitle
                        ? $command->title
                        : $screen->title,
                    'subtitle' => $command->hasSubtitle
                        ? $command->subtitle
                        : $screen->subtitle,
                    'description' => $command->hasDescription
                        ? $command->description
                        : $screen->description,
                    'image_path' => $imagePath,
                    'updated_by' => $actor->id,
                ]);

                AuditLogger::log($actor, $screen, 'updated', 'Screen upserted');

                return $screen->fresh(['customFields']);
            });
        } catch (Throwable $exception) {
            $this->imageService->delete($newImagePath);

            throw $exception;
        }

        if ($newImagePath !== null) {
            $this->imageService->delete($previousImagePath);
        }

        return $screen;
    }

    public function update(User $actor, Screen $screen, UpdateScreenCommand $command): Screen
    {
        $screen->loadMissing('workflowVersion');
        abort_if($screen->workflowVersion->is_published, 422, 'Cannot modify a published revision.');

        return DB::transaction(function () use ($actor, $screen, $command): Screen {
            $screen->update([
                ...$command->toArray(),
                'updated_by' => $actor->id,
            ]);

            AuditLogger::log($actor, $screen, 'updated', 'Screen updated');

            return $screen->fresh(['customFields']);
        });
    }

    public function upsertForMcp(User $actor, WorkflowVersion $workflowVersion, UpsertScreenCommand $command): Screen
    {
        return $this->upsert($actor, $workflowVersion, $command);
    }
}
