<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Screen;
use App\Models\User;
use App\Services\ProjectAccessService;

final class ScreenPolicy
{
    public function __construct(private readonly ProjectAccessService $access) {}

    public function view(User $user, Screen $screen): bool
    {
        $screen->loadMissing('workflowRevision.workflow.project');

        $project = $screen->workflowRevision?->workflow?->project;
        if (! $project instanceof Project)
        {
            return false;
        }

        return $this->access->canView($user, $project);
    }

    public function update(User $user, Screen $screen): bool
    {
        $screen->loadMissing('workflowRevision.workflow.project');

        $project = $screen->workflowRevision?->workflow?->project;
        if (! $project instanceof Project)
        {
            return false;
        }

        return $this->access->canEdit($user, $project);
    }
}
