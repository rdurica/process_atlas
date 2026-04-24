<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Response\WorkflowVersionResponse;
use App\Models\User;
use App\Models\WorkflowVersion;
use App\Services\Audit\AuditLogger;
use App\Services\Cache\PublishedWorkflowCacheService;
use App\Services\Workflow\WorkflowVersionService;

final class PublishWorkflowVersionCommand
{
    public function __construct(
        private readonly WorkflowVersionService $versionService,
        private readonly PublishedWorkflowCacheService $cache,
    ) {}

    public function execute(User $actor, WorkflowVersion $workflowVersion): WorkflowVersionResponse
    {
        $workflow = $this->versionService->publishVersion($workflowVersion);

        $this->cache->forget($workflow->id);

        AuditLogger::log($actor, $workflowVersion, 'published', 'Workflow revision published', [
            'workflow_id' => $workflowVersion->workflow_id,
        ]);

        return WorkflowVersionResponse::fromModel($workflowVersion->fresh());
    }
}
