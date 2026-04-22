<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use App\Services\ProjectAccessService;
use App\Support\PermissionList;

final class ProjectPolicy
{
    public function __construct(private readonly ProjectAccessService $access) {}

    public function view(User $user, Project $project): bool
    {
        return $this->access->canView($user, $project);
    }

    public function create(User $user): bool
    {
        return $user->can(PermissionList::PROJECTS_CREATE);
    }

    public function update(User $user, Project $project): bool
    {
        return $this->access->canManageMembers($user, $project);
    }

    public function delete(User $user, Project $project): bool
    {
        return $this->access->canManageMembers($user, $project);
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return $this->access->canManageMembers($user, $project);
    }

    public function editWorkflows(User $user, Project $project): bool
    {
        return $this->access->canEdit($user, $project);
    }

    public function publishWorkflows(User $user, Project $project): bool
    {
        return $this->access->canPublish($user, $project);
    }
}
