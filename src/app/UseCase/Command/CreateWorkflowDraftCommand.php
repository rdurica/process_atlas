<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Response\WorkflowVersionResponse;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Audit\AuditLogger;
use App\Services\Workflow\WorkflowVersionService;

final class CreateWorkflowDraftCommand
{
    public function __construct(
        private readonly WorkflowVersionService $versionService,
    ) {}

    public function execute(User $actor, Workflow $workflow): WorkflowVersionResponse
    {
        $version = $this->versionService->createDraftFromLatest($workflow, $actor);

        AuditLogger::log($actor, $version, 'created', 'Draft workflow revision created', [
            'workflow_id' => $workflow->id,
        ]);

        return WorkflowVersionResponse::fromModel($version);
    }
}
