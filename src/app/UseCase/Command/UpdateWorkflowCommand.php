<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\UpdateWorkflowRequest;
use App\DTO\Response\WorkflowResponse;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Audit\AuditLogger;
use App\Services\Cache\PublishedWorkflowCacheService;

final class UpdateWorkflowCommand
{
    public function __construct(
        private readonly PublishedWorkflowCacheService $cache,
    ) {}

    public function execute(User $actor, Workflow $workflow, UpdateWorkflowRequest $request): WorkflowResponse
    {
        $workflow->update($request->toArray());

        $this->cache->forget($workflow->id);

        AuditLogger::log($actor, $workflow, 'updated', 'Workflow updated');

        return WorkflowResponse::fromModel($workflow);
    }
}
