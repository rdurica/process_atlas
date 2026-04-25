<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\CreateWorkflowRequest;
use App\DTO\Response\WorkflowResponse;
use App\Exceptions\WorkflowNotFoundException;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\Project;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Audit\AuditLogger;
use App\Services\Workflow\WorkflowRevisionService;

final class CreateWorkflowCommand
{
    public function __construct(
        private readonly WorkflowRevisionService $revisionService,
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, Project $project, CreateWorkflowRequest $request): WorkflowResponse
    {
        $workflow = $this->transactionManager->transactional(function () use ($actor, $project, $request): Workflow
        {
            $workflow = $project->workflows()->create([
                'name'   => $request->name,
                'status' => 'draft',
            ]);

            $this->revisionService->createInitialRevision($workflow, $actor);

            $workflow = $workflow->fresh(['latestRevision', 'publishedRevision']);
            if (! $workflow instanceof Workflow)
            {
                throw new WorkflowNotFoundException('Workflow not found after creation.');
            }

            return $workflow;
        });

        AuditLogger::log($actor, $workflow, 'created', 'Workflow created', [
            'initial_revision_id' => $workflow->latest_revision_id,
        ]);

        return WorkflowResponse::fromModel($workflow);
    }
}
