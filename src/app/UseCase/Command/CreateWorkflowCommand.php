<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\CreateWorkflowRequest;
use App\DTO\Response\WorkflowResponse;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\Project;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Audit\AuditLogger;
use App\Services\Workflow\WorkflowVersionService;

final class CreateWorkflowCommand
{
    public function __construct(
        private readonly WorkflowVersionService $versionService,
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

            $this->versionService->createInitialVersion($workflow, $actor);

            return $workflow->fresh(['latestVersion', 'publishedVersion']);
        });

        AuditLogger::log($actor, $workflow, 'created', 'Workflow created', [
            'initial_version_id' => $workflow->latest_version_id,
        ]);

        return WorkflowResponse::fromModel($workflow);
    }
}
