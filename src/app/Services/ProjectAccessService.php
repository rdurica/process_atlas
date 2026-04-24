<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use App\Support\PermissionList;

class ProjectAccessService
{
    /**
     * Returns the user's role in the project, or null if not a member.
     * Admins implicitly have 'process_owner' level access to all projects.
     */
    public function getProjectRole(User $user, Project $project): ?string
    {
        if ($user->can(PermissionList::PROJECTS_ADMIN))
        {
            return 'process_owner';
        }

        return $user->projectRoleIn($project);
    }

    /**
     * Can the user see this project at all?
     */
    public function canView(User $user, Project $project): bool
    {
        return $this->getProjectRole($user, $project) !== null;
    }

    /**
     * Can the user edit workflows in this project? (editor or process_owner)
     */
    public function canEdit(User $user, Project $project): bool
    {
        return in_array($this->getProjectRole($user, $project), ['editor', 'process_owner'], true);
    }

    /**
     * Can the user publish workflows in this project? (process_owner only)
     */
    public function canPublish(User $user, Project $project): bool
    {
        return $this->getProjectRole($user, $project) === 'process_owner';
    }

    /**
     * Can the user manage project members? (admin globally, or process_owner in this project)
     */
    public function canManageMembers(User $user, Project $project): bool
    {
        if ($user->can(PermissionList::PROJECTS_ADMIN))
        {
            return true;
        }

        return $user->can(PermissionList::PROJECTS_CREATE)
            && $user->projectRoleIn($project) === 'process_owner';
    }
}
