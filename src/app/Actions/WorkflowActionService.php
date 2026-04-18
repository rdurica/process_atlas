<?php

namespace App\Actions;

use App\DTO\Command\CreateWorkflowCommand;
use App\DTO\Command\UpdateWorkflowCommand;
use App\Models\Project;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Audit\AuditLogger;
use App\Services\Workflow\WorkflowVersionManager;

final class WorkflowActionService
{
    public function __construct(private readonly WorkflowVersionManager $versionManager)
    {
    }

    public function create(User $actor, Project $project, CreateWorkflowCommand $command): Workflow
    {
        $workflow = $project->workflows()->create([
            'name' => $command->name,
            'status' => 'draft',
        ]);

        $initialVersion = $this->versionManager->createInitialVersion($workflow, $actor);

        AuditLogger::log($actor, $workflow, 'created', 'Workflow created', [
            'initial_version_id' => $initialVersion->id,
        ]);

        return $workflow->fresh(['latestVersion', 'publishedVersion']);
    }

    public function update(User $actor, Workflow $workflow, UpdateWorkflowCommand $command): Workflow
    {
        $workflow->update($command->toArray());

        AuditLogger::log($actor, $workflow, 'updated', 'Workflow updated');

        return $workflow;
    }
}
