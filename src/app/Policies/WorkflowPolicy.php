<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workflow;
use App\Services\ProjectAccessService;

final class WorkflowPolicy
{
    public function __construct(private readonly ProjectAccessService $access) {}

    public function view(User $user, Workflow $workflow): bool
    {
        $workflow->loadMissing('project');

        return $this->access->canView($user, $workflow->project);
    }

    public function update(User $user, Workflow $workflow): bool
    {
        $workflow->loadMissing('project');

        return $this->access->canEdit($user, $workflow->project);
    }

    public function createDraft(User $user, Workflow $workflow): bool
    {
        $workflow->loadMissing('project');

        return $this->access->canEdit($user, $workflow->project);
    }

    public function rollback(User $user, Workflow $workflow): bool
    {
        $workflow->loadMissing('project');

        return $this->access->canPublish($user, $workflow->project);
    }
}
