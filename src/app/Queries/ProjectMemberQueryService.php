<?php

namespace App\Queries;

use App\DTO\Result\ProjectMemberResult;
use App\Models\Project;
use App\Models\User;

final class ProjectMemberQueryService
{
    /**
     * @return list<ProjectMemberResult>
     */
    public function list(Project $project): array
    {
        return $project->members()
            ->get()
            ->map(fn(User $user): ProjectMemberResult => ProjectMemberResult::fromUser($user, (string) $user->pivot->role))
            ->values()
            ->all();
    }

    public function findByEmail(string $email): User
    {
        return User::query()->where('email', $email)->firstOrFail();
    }
}
