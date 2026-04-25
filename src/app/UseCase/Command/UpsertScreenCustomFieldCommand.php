<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\UpsertScreenCustomFieldRequest;
use App\DTO\Response\ScreenCustomFieldResponse;
use App\Exceptions\ConsistencyException;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\Screen;
use App\Models\User;
use App\Models\WorkflowRevision;
use App\Services\Audit\AuditLogger;

final class UpsertScreenCustomFieldCommand
{
    public function __construct(
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, Screen $screen, UpsertScreenCustomFieldRequest $request): ScreenCustomFieldResponse
    {
        return $this->transactionManager->transactional(function () use ($actor, $screen, $request): ScreenCustomFieldResponse
        {
            $screen = Screen::query()
                ->with('workflowRevision')
                ->whereKey($screen->id)
                ->lockForUpdate()
                ->firstOrFail();

            $workflowRevision = $screen->workflowRevision;
            if (! $workflowRevision instanceof WorkflowRevision)
            {
                throw new ConsistencyException('Screen is missing a workflow revision.');
            }
            abort_if($workflowRevision->is_published, 422, 'Cannot modify a published revision.');

            $field = $screen->customFields()->updateOrCreate(
                ['key' => $request->key],
                [
                    'field_type' => $request->fieldType ?? 'text',
                    'value'      => $request->value,
                    'sort_order' => $request->hasSortOrder
                        ? $request->sortOrder
                        : (((int) $screen->customFields()->max('sort_order')) + 1),
                ],
            );

            AuditLogger::log($actor, $field, 'updated', 'Screen custom field upserted');

            return ScreenCustomFieldResponse::fromModel($field);
        });
    }
}
