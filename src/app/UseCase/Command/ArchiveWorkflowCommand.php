<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Response\WorkflowResponse;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Audit\AuditLogger;
use App\Services\Cache\PublishedWorkflowCacheService;

final class ArchiveWorkflowCommand
{
    public function __construct(
        private readonly PublishedWorkflowCacheService $cache,
    ) {}

    public function execute(User $actor, Workflow $workflow): WorkflowResponse
    {
        $workflow->update(['archived_at' => now()]);

        $this->cache->forget($workflow->id);

        AuditLogger::log($actor, $workflow, 'archived', 'Workflow archived');

        return WorkflowResponse::fromModel($workflow);
    }
}
