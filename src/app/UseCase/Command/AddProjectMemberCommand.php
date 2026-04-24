<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\AddProjectMemberRequest;
use App\DTO\Response\ProjectMemberResponse;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class AddProjectMemberCommand
{
    public function __construct(
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, Project $project, User $member, AddProjectMemberRequest $request): ProjectMemberResponse
    {
        return $this->transactionManager->transactional(function () use ($actor, $project, $member, $request): ProjectMemberResponse
        {
            $project = $this->lockProject($project);

            $project->members()->syncWithoutDetaching([
                $member->id => ['role' => $request->role],
            ]);

            AuditLogger::log($actor, $project, 'updated', 'Project member added', [
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
}
