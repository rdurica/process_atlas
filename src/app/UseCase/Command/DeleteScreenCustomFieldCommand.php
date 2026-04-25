<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\Exceptions\ConsistencyException;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\ScreenCustomField;
use App\Models\User;
use App\Models\WorkflowRevision;
use App\Services\Audit\AuditLogger;

final class DeleteScreenCustomFieldCommand
{
    public function __construct(
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, ScreenCustomField $screenCustomField): void
    {
        $this->transactionManager->transactional(function () use ($actor, $screenCustomField): void
        {
            $screenCustomField = ScreenCustomField::query()
                ->with('screen.workflowRevision')
                ->whereKey($screenCustomField->id)
                ->lockForUpdate()
                ->firstOrFail();

            $workflowRevision = $screenCustomField->screen?->workflowRevision;
            if (! $workflowRevision instanceof WorkflowRevision)
            {
                throw new ConsistencyException('Screen custom field is missing a workflow revision.');
            }
            abort_if($workflowRevision->is_published, 422, 'Cannot modify a published revision.');

            $screenCustomField->delete();

            AuditLogger::log($actor, $screenCustomField, 'deleted', 'Screen custom field deleted');
        });
    }
}
