<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use App\Models\Workflow;
use App\Services\ProjectAccessService;

final class WorkflowPolicy
{
    public function __construct(private readonly ProjectAccessService $access) {}

    public function view(User $user, Workflow $workflow): bool
    {
        $workflow->loadMissing('project');

        $project = $workflow->project;
        if (! $project instanceof Project)
        {
            return false;
        }

        return $this->access->canView($user, $project);
    }

    public function update(User $user, Workflow $workflow): bool
    {
        $workflow->loadMissing('project');

        $project = $workflow->project;
        if (! $project instanceof Project)
        {
            return false;
        }

        return $this->access->canEdit($user, $project);
    }

    public function createDraft(User $user, Workflow $workflow): bool
    {
        $workflow->loadMissing('project');

        $project = $workflow->project;
        if (! $project instanceof Project)
        {
            return false;
        }

        return $this->access->canEdit($user, $project);
    }

    public function rollback(User $user, Workflow $workflow): bool
    {
        $workflow->loadMissing('project');

        $project = $workflow->project;
        if (! $project instanceof Project)
        {
            return false;
        }

        return $this->access->canPublish($user, $project);
    }

    public function archive(User $user, Workflow $workflow): bool
    {
        $workflow->loadMissing('project');

        $project = $workflow->project;
        if (! $project instanceof Project)
        {
            return false;
        }

        return $this->access->canPublish($user, $project);
    }
}
