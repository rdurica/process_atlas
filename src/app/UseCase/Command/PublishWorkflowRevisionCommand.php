<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Response\WorkflowRevisionResponse;
use App\Exceptions\WorkflowRevisionNotFoundException;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\User;
use App\Models\WorkflowRevision;
use App\Services\Audit\AuditLogger;
use App\Services\Cache\PublishedWorkflowCacheService;
use App\Services\Workflow\WorkflowRevisionService;

final class PublishWorkflowRevisionCommand
{
    public function __construct(
        private readonly WorkflowRevisionService $revisionService,
        private readonly PublishedWorkflowCacheService $cache,
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, WorkflowRevision $workflowRevision, bool $force = false): WorkflowRevisionResponse
    {
        /** @var array{workflow_id: int, response: WorkflowRevisionResponse} $result */
        $result = $this->transactionManager->transactional(function () use ($actor, $workflowRevision, $force): array
        {
            $workflow = $this->revisionService->publishRevision($workflowRevision, $force);

            AuditLogger::log($actor, $workflowRevision, 'published', 'Workflow revision published', [
                'workflow_id' => $workflowRevision->workflow_id,
            ]);

            $freshRevision = $workflowRevision->fresh();
            if (! $freshRevision instanceof WorkflowRevision)
            {
                throw new WorkflowRevisionNotFoundException('Workflow revision not found after publish.');
            }

            return [
                'workflow_id' => $workflow->id,
                'response'    => WorkflowRevisionResponse::fromModel($freshRevision),
            ];
        });

        $this->cache->forget($result['workflow_id']);

        return $result['response'];
    }
}
