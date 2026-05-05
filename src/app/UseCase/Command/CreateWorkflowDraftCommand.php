<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Response\WorkflowRevisionResponse;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Audit\AuditLogger;
use App\Services\Workflow\WorkflowRevisionService;

final class CreateWorkflowDraftCommand
{
    public function __construct(
        private readonly WorkflowRevisionService $revisionService,
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, Workflow $workflow, ?string $draftName = null, ?string $sourceRevisionId = null): WorkflowRevisionResponse
    {
        return $this->transactionManager->transactional(function () use ($actor, $workflow, $draftName, $sourceRevisionId): WorkflowRevisionResponse
        {
            $revision = $this->revisionService->createDraftFromSource($workflow, $actor, $draftName, $sourceRevisionId);

            AuditLogger::log($actor, $revision, 'created', 'Draft workflow revision created', [
                'workflow_id' => $workflow->uuid,
            ]);

            return WorkflowRevisionResponse::fromModel($revision);
        });
    }
}
