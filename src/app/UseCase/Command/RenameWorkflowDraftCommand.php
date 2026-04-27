<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Response\WorkflowRevisionResponse;
use App\Models\User;
use App\Models\WorkflowRevision;
use App\Services\Audit\AuditLogger;
use App\Services\Workflow\WorkflowRevisionService;

final class RenameWorkflowDraftCommand
{
    public function __construct(
        private readonly WorkflowRevisionService $revisionService,
    ) {}

    public function execute(User $actor, WorkflowRevision $revision, string $name): WorkflowRevisionResponse
    {
        $this->revisionService->renameDraft($revision, $name);

        AuditLogger::log($actor, $revision, 'updated', 'Draft renamed', [
            'workflow_id' => $revision->workflow_id,
            'new_name'    => $name,
        ]);

        $freshRevision = $revision->fresh();
        if (! $freshRevision instanceof WorkflowRevision)
        {
            throw new \RuntimeException('Workflow revision not found after rename.');
        }

        return WorkflowRevisionResponse::fromModel($freshRevision);
    }
}
