<?php

namespace App\Actions;

use App\DTO\Command\AddProjectMemberCommand;
use App\DTO\Command\UpdateProjectMemberRoleCommand;
use App\DTO\Result\ProjectMemberResult;
use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class ProjectMemberActionService
{
    public function add(User $actor, Project $project, User $member, AddProjectMemberCommand $command): ProjectMemberResult
    {
        $project->members()->syncWithoutDetaching([
            $member->id => ['role' => $command->role],
        ]);

        AuditLogger::log($actor, $project, 'updated', 'Project member added', [
            'member_id' => $member->id,
            'role' => $command->role,
        ]);

        return ProjectMemberResult::fromUser($member, $command->role);
    }

    public function updateRole(
        User $actor,
        Project $project,
        User $member,
        UpdateProjectMemberRoleCommand $command
    ): ProjectMemberResult {
        $project->members()->updateExistingPivot($member->id, ['role' => $command->role]);

        AuditLogger::log($actor, $project, 'updated', 'Project member role updated', [
            'member_id' => $member->id,
            'role' => $command->role,
        ]);

        return ProjectMemberResult::fromUser($member, $command->role);
    }

    public function remove(User $actor, Project $project, User $member): void
    {
        $processOwnerCount = $project->members()->wherePivot('role', 'process_owner')->count();
        $isThisUserProcessOwner = $project->members()
            ->wherePivot('user_id', $member->id)
            ->wherePivot('role', 'process_owner')
            ->exists();

        abort_if(
            $isThisUserProcessOwner && $processOwnerCount <= 1,
            422,
            'Cannot remove the last process owner from a project.'
        );

        $project->members()->detach($member->id);

        AuditLogger::log($actor, $project, 'updated', 'Project member removed', [
            'member_id' => $member->id,
        ]);
    }
}
