<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use App\Models\WorkflowRevision;
use App\Services\ProjectAccessService;

final class WorkflowRevisionPolicy
{
    public function __construct(private readonly ProjectAccessService $access) {}

    public function view(User $user, WorkflowRevision $workflowRevision): bool
    {
        $workflowRevision->loadMissing('workflow.project');

        $project = $workflowRevision->workflow?->project;
        if (! $project instanceof Project)
        {
            return false;
        }

        return $this->access->canView($user, $project);
    }

    public function updateGraph(User $user, WorkflowRevision $workflowRevision): bool
    {
        $workflowRevision->loadMissing('workflow.project');

        $project = $workflowRevision->workflow?->project;
        if (! $project instanceof Project)
        {
            return false;
        }

        return $this->access->canEdit($user, $project);
    }

    public function publish(User $user, WorkflowRevision $workflowRevision): bool
    {
        $workflowRevision->loadMissing('workflow.project');

        $project = $workflowRevision->workflow?->project;
        if (! $project instanceof Project)
        {
            return false;
        }

        return $this->access->canPublish($user, $project);
    }

    public function delete(User $user, WorkflowRevision $workflowRevision): bool
    {
        $workflowRevision->loadMissing('workflow.project');

        $project = $workflowRevision->workflow?->project;
        if (! $project instanceof Project)
        {
            return false;
        }

        return $this->access->canPublish($user, $project);
    }
}
