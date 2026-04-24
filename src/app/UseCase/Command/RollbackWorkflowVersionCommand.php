<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Response\WorkflowVersionResponse;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Services\Audit\AuditLogger;
use App\Services\Cache\PublishedWorkflowCacheService;
use App\Services\Workflow\WorkflowVersionService;

final class RollbackWorkflowVersionCommand
{
    public function __construct(
        private readonly WorkflowVersionService $versionService,
        private readonly PublishedWorkflowCacheService $cache,
    ) {}

    public function execute(User $actor, Workflow $workflow, WorkflowVersion $target): WorkflowVersionResponse
    {
        $newVersion = $this->versionService->rollbackToVersion($workflow, $target, $actor);

        $this->cache->forget($workflow->id);

        AuditLogger::log($actor, $newVersion, 'created', 'Rollback draft created', [
            'workflow_id'       => $workflow->id,
            'source_version_id' => $target->id,
        ]);

        return WorkflowVersionResponse::fromModel($newVersion);
    }
}
