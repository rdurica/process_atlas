<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Response\WorkflowRevisionResponse;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowRevision;
use App\Services\Audit\AuditLogger;

final class SwitchToDraftCommand
{
    public function __construct(
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, Workflow $workflow, WorkflowRevision $targetDraft): WorkflowRevisionResponse
    {
        return $this->transactionManager->transactional(function () use ($actor, $workflow, $targetDraft): WorkflowRevisionResponse
        {
            abort_unless($targetDraft->workflow_id === $workflow->id, 422, 'Target revision does not belong to this workflow.');

            $workflow = Workflow::query()->whereKey($workflow->id)->lockForUpdate()->firstOrFail();
            $targetDraft = $workflow->revisions()->whereKey($targetDraft->id)->firstOrFail();

            abort_if($targetDraft->is_published, 422, 'Cannot switch to a published revision.');

            $workflow->update([
                'latest_revision_id' => $targetDraft->id,
                'status'             => 'draft',
            ]);

            AuditLogger::log($actor, $targetDraft, 'updated', 'Switched to draft', [
                'workflow_id' => $workflow->uuid,
            ]);

            return WorkflowRevisionResponse::fromModel($targetDraft);
        });
    }
}
