<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\Models\User;
use App\Models\WorkflowVersion;
use App\Services\Audit\AuditLogger;
use App\Services\Cache\PublishedWorkflowCacheService;
use App\Services\Workflow\WorkflowVersionService;

final class DeleteWorkflowVersionCommand
{
    public function __construct(
        private readonly WorkflowVersionService $versionService,
        private readonly PublishedWorkflowCacheService $cache,
    ) {}

    public function execute(User $actor, WorkflowVersion $workflowVersion): void
    {
        $workflowVersion->loadMissing('workflow');

        $versionNumber = $workflowVersion->version_number;
        $workflowId = $workflowVersion->workflow_id;

        $workflow = $this->versionService->deleteVersion($workflowVersion->workflow, $workflowVersion);

        $this->cache->forget($workflow->id);

        AuditLogger::log($actor, $workflow, 'deleted', 'Workflow revision deleted', [
            'version_id'     => $workflowVersion->id,
            'version_number' => $versionNumber,
            'workflow_id'    => $workflowId,
        ]);
    }
}
