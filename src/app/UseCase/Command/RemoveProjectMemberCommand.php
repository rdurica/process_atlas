<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\Infrastructure\Transaction\TransactionManager;
use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class RemoveProjectMemberCommand
{
    public function __construct(
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, Project $project, User $member): void
    {
        $this->transactionManager->transactional(function () use ($actor, $project, $member): void
        {
            $project = $this->lockProject($project);
            $isThisUserProcessOwner = $project->members()
                ->wherePivot('user_id', $member->id)
                ->wherePivot('role', 'process_owner')
                ->exists();

            if ($isThisUserProcessOwner)
            {
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
