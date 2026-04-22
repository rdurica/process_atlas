<?php

namespace App\Policies;

use App\Models\Screen;
use App\Models\User;
use App\Services\ProjectAccessService;

final class ScreenPolicy
{
    public function __construct(private readonly ProjectAccessService $access) {}

    public function view(User $user, Screen $screen): bool
    {
        $screen->loadMissing('workflowVersion.workflow.project');

        return $this->access->canView($user, $screen->workflowVersion->workflow->project);
    }

    public function update(User $user, Screen $screen): bool
    {
        $screen->loadMissing('workflowVersion.workflow.project');

        return $this->access->canEdit($user, $screen->workflowVersion->workflow->project);
    }
}
