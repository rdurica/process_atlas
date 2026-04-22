<?php

namespace App\Queries;

use App\DTO\Result\ProjectMemberResult;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\Pivot;

final class ProjectMemberQueryService
{
    /**
     * @return list<ProjectMemberResult>
     */
    public function list(Project $project): array
    {
        return $project->members()
            ->get()
            ->map(function (User $user): ProjectMemberResult {
                $pivot = $user->getRelation('pivot');
                $role = $pivot instanceof Pivot ? $pivot->getAttribute('role') : '';

                return ProjectMemberResult::fromUser($user, is_string($role) ? $role : '');
            })
            ->values()
            ->all();
    }

    public function findByEmail(string $email): User
    {
        return User::query()->where('email', $email)->firstOrFail();
    }
}
