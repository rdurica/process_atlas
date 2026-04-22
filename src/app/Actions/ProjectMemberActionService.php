<?php

namespace App\Actions;

use App\DTO\Command\AddProjectMemberCommand;
use App\DTO\Command\UpdateProjectMemberRoleCommand;
use App\DTO\Result\ProjectMemberResult;
use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Support\Facades\DB;

final class ProjectMemberActionService
{
    public function add(User $actor, Project $project, User $member, AddProjectMemberCommand $command): ProjectMemberResult
    {
        return DB::transaction(function () use ($actor, $project, $member, $command): ProjectMemberResult {
            $project = $this->lockProject($project);

            $project->members()->syncWithoutDetaching([
                $member->id => ['role' => $command->role],
            ]);

            AuditLogger::log($actor, $project, 'updated', 'Project member added', [
                'member_id' => $member->id,
                'role' => $command->role,
            ]);

            return ProjectMemberResult::fromUser($member, $command->role);
        });
    }

    public function updateRole(
        User $actor,
        Project $project,
        User $member,
        UpdateProjectMemberRoleCommand $command
    ): ProjectMemberResult {
        return DB::transaction(function () use ($actor, $project, $member, $command): ProjectMemberResult {
            $project = $this->lockProject($project);
            $currentRole = $project->members()
                ->wherePivot('user_id', $member->id)
                ->value('project_members.role');

            abort_if($currentRole === null, 404, 'Project member not found.');

            if ($currentRole === 'process_owner' && $command->role !== 'process_owner') {
                $this->ensureAnotherProcessOwnerExists($project, $member);
            }

            $project->members()->updateExistingPivot($member->id, ['role' => $command->role]);

            AuditLogger::log($actor, $project, 'updated', 'Project member role updated', [
                'member_id' => $member->id,
                'role' => $command->role,
            ]);

            return ProjectMemberResult::fromUser($member, $command->role);
        });
    }

    public function remove(User $actor, Project $project, User $member): void
    {
        DB::transaction(function () use ($actor, $project, $member): void {
            $project = $this->lockProject($project);
            $isThisUserProcessOwner = $project->members()
                ->wherePivot('user_id', $member->id)
                ->wherePivot('role', 'process_owner')
                ->exists();

            if ($isThisUserProcessOwner) {
                $this->ensureAnotherProcessOwnerExists($project, $member);
            }

            $project->members()->detach($member->id);

            AuditLogger::log($actor, $project, 'updated', 'Project member removed', [
                'member_id' => $member->id,
            ]);
        });
    }

    private function lockProject(Project $project): Project
    {
        return Project::query()->whereKey($project->id)->lockForUpdate()->firstOrFail();
    }

    private function ensureAnotherProcessOwnerExists(Project $project, User $member): void
    {
        $hasAnotherProcessOwner = $project->members()
            ->wherePivot('role', 'process_owner')
            ->wherePivot('user_id', '!=', $member->id)
            ->exists();

        abort_unless($hasAnotherProcessOwner, 422, 'Cannot remove the last process owner from a project.');
    }
}
