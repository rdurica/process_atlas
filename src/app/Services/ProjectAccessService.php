<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use App\Support\PermissionList;

class ProjectAccessService
{
    /**
     * Returns the user's effective role in the project, or null if no access.
     * Hierarchy: admin > process_owner > editor > viewer
     */
    public function getProjectRole(User $user, Project $project): ?string
    {
        if ($user->can(PermissionList::PROJECTS_ADMIN))
        {
            return 'process_owner';
        }

        $explicitRole = $user->projectRoleIn($project);
        if ($explicitRole !== null)
        {
            return $explicitRole;
        }

        if ($project->isPublic() && $project->archived_at === null)
        {
            return 'viewer';
        }

        return null;
    }

    /**
     * Can the user see this project at all?
     */
    public function canView(User $user, Project $project): bool
    {
        return $this->getProjectRole($user, $project) !== null;
    }

    /**
     * Can the user edit workflows in this project?
     */
    public function canEdit(User $user, Project $project): bool
    {
        if ($project->isArchived())
        {
            return false;
        }

        return in_array($this->getProjectRole($user, $project), ['editor', 'process_owner'], true);
    }

    /**
     * Can the user publish workflow revisions in this project?
     */
    public function canPublish(User $user, Project $project): bool
    {
        if ($project->isArchived())
        {
            return false;
        }

        return in_array($this->getProjectRole($user, $project), ['editor', 'process_owner'], true);
    }

    /**
     * Can the user archive workflows in this project? (process_owner only)
     */
    public function canArchive(User $user, Project $project): bool
    {
        if ($project->isArchived())
        {
            return false;
        }

        return $this->getProjectRole($user, $project) === 'process_owner';
    }

    /**
     * Can the user unarchive this project? (process_owner or admin)
     */
    public function canUnarchive(User $user, Project $project): bool
    {
        if (! $project->isArchived())
        {
            return false;
        }

        if ($user->can(PermissionList::PROJECTS_ADMIN))
        {
            return true;
        }

        return $user->projectRoleIn($project) === 'process_owner';
    }

    /**
     * Can the user manage project members?
     * Admin globally, or process_owner in this project (if not archived).
     */
    public function canManageMembers(User $user, Project $project): bool
    {
        if ($project->isArchived())
        {
            return false;
        }

        if ($user->can(PermissionList::PROJECTS_ADMIN))
        {
            return true;
        }

        return $user->projectRoleIn($project) === 'process_owner';
    }
}
