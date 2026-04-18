<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkflowVersion;
use App\Services\ProjectAccessService;

final class WorkflowVersionPolicy
{
    public function __construct(private readonly ProjectAccessService $access)
    {
    }

    public function view(User $user, WorkflowVersion $workflowVersion): bool
    {
        $workflowVersion->loadMissing('workflow.project');

        return $this->access->canView($user, $workflowVersion->workflow->project);
    }

    public function updateGraph(User $user, WorkflowVersion $workflowVersion): bool
    {
        $workflowVersion->loadMissing('workflow.project');

        return $this->access->canEdit($user, $workflowVersion->workflow->project);
    }

    public function publish(User $user, WorkflowVersion $workflowVersion): bool
    {
        $workflowVersion->loadMissing('workflow.project');

        return $this->access->canPublish($user, $workflowVersion->workflow->project);
    }

    public function delete(User $user, WorkflowVersion $workflowVersion): bool
    {
        $workflowVersion->loadMissing('workflow.project');

        return $this->access->canPublish($user, $workflowVersion->workflow->project);
    }
}
