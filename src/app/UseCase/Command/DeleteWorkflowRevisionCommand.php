<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\Exceptions\ConsistencyException;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowRevision;
use App\Services\Audit\AuditLogger;
use App\Services\Cache\PublishedWorkflowCacheService;
use App\Services\Workflow\WorkflowRevisionService;

final class DeleteWorkflowRevisionCommand
{
    public function __construct(
        private readonly WorkflowRevisionService $revisionService,
        private readonly PublishedWorkflowCacheService $cache,
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, WorkflowRevision $workflowRevision): void
    {
        $workflowId = $this->transactionManager->transactional(function () use ($actor, $workflowRevision): int
        {
            $workflowRevision->loadMissing('workflow');

            $revisionNumber = $workflowRevision->revision_number;
            $workflowId = $workflowRevision->workflow_id;

            $workflow = $workflowRevision->workflow;
            if (! $workflow instanceof Workflow)
            {
                throw new ConsistencyException('Workflow revision is missing a workflow.');
            }
            $workflow = $this->revisionService->deleteRevision($workflow, $workflowRevision);

            AuditLogger::log($actor, $workflow, 'deleted', 'Workflow revision deleted', [
                'revision_id'     => $workflowRevision->id,
                'revision_number' => $revisionNumber,
                'workflow_id'     => $workflowId,
            ]);

            return $workflow->id;
        });

        $this->cache->forget($workflowId);
    }
}
