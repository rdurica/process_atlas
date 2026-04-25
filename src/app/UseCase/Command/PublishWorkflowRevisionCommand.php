<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Response\WorkflowRevisionResponse;
use App\Exceptions\WorkflowRevisionNotFoundException;
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
    ) {}

    public function execute(User $actor, WorkflowRevision $workflowRevision): WorkflowRevisionResponse
    {
        $workflow = $this->revisionService->publishRevision($workflowRevision);

        $this->cache->forget($workflow->id);

        AuditLogger::log($actor, $workflowRevision, 'published', 'Workflow revision published', [
            'workflow_id' => $workflowRevision->workflow_id,
        ]);

        $freshRevision = $workflowRevision->fresh();
        if (! $freshRevision instanceof WorkflowRevision)
        {
            throw new WorkflowRevisionNotFoundException('Workflow revision not found after publish.');
        }

        return WorkflowRevisionResponse::fromModel($freshRevision);
    }
}
