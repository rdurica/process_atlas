<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\UpdateProjectMemberRoleRequest;
use App\DTO\Response\ProjectMemberResponse;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class UpdateProjectMemberRoleCommand
{
    public function __construct(
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(
        User $actor,
        Project $project,
        User $member,
        UpdateProjectMemberRoleRequest $request,
    ): ProjectMemberResponse {
        return $this->transactionManager->transactional(function () use ($actor, $project, $member, $request): ProjectMemberResponse
        {
            $project = $this->lockProject($project);
            $currentRole = $project->members()
                ->wherePivot('user_id', $member->id)
                ->value('project_members.role');

            abort_if($currentRole === null, 404, 'Project member not found.');

            if ($currentRole === 'process_owner' && $request->role !== 'process_owner')
            {
                $this->ensureAnotherProcessOwnerExists($project, $member);
            }

            $project->members()->updateExistingPivot($member->id, ['role' => $request->role]);

            AuditLogger::log($actor, $project, 'updated', 'Project member role updated', [
                'member_id' => $member->id,
                'role'      => $request->role,
            ]);

            return ProjectMemberResponse::fromUser($member, $request->role);
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
