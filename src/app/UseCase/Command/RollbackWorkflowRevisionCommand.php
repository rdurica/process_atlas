<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Response\WorkflowRevisionResponse;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowRevision;
use App\Services\Audit\AuditLogger;
use App\Services\Cache\PublishedWorkflowCacheService;
use App\Services\Workflow\WorkflowRevisionService;

final class RollbackWorkflowRevisionCommand
{
    public function __construct(
        private readonly WorkflowRevisionService $revisionService,
        private readonly PublishedWorkflowCacheService $cache,
    ) {}

    public function execute(User $actor, Workflow $workflow, WorkflowRevision $target): WorkflowRevisionResponse
    {
        $newRevision = $this->revisionService->rollbackToRevision($workflow, $target, $actor);

        $this->cache->forget($workflow->id);

        AuditLogger::log($actor, $newRevision, 'created', 'Rollback draft created', [
            'workflow_id'        => $workflow->id,
            'source_revision_id' => $target->id,
        ]);

        return WorkflowRevisionResponse::fromModel($newRevision);
    }
}
