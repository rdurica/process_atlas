<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Response\WorkflowRevisionResponse;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Audit\AuditLogger;
use App\Services\Workflow\WorkflowRevisionService;

final class CreateWorkflowDraftCommand
{
    public function __construct(
        private readonly WorkflowRevisionService $revisionService,
    ) {}

    public function execute(User $actor, Workflow $workflow): WorkflowRevisionResponse
    {
        $revision = $this->revisionService->createDraftFromLatest($workflow, $actor);

        AuditLogger::log($actor, $revision, 'created', 'Draft workflow revision created', [
            'workflow_id' => $workflow->id,
        ]);

        return WorkflowRevisionResponse::fromModel($revision);
    }
}
