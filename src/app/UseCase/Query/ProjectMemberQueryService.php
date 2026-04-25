<?php

namespace App\UseCase\Query;

use App\DTO\Response\ProjectMemberResponse;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\Pivot;

final class ProjectMemberQueryService
{
    /**
     * @return list<ProjectMemberResponse>
     */
    public function list(Project $project): array
    {
        $result = $project->members()
            ->get()
            ->map(function (User $user): ProjectMemberResponse
            {
                $pivot = $user->getRelation('pivot');
                $role = $pivot instanceof Pivot ? $pivot->getAttribute('role') : '';

                return ProjectMemberResponse::fromUser($user, is_string($role) ? $role : '');
            })
            ->values()
            ->all();

        return array_values($result);
    }

    public function findByEmail(string $email): User
    {
        return User::query()->where('email', $email)->firstOrFail();
    }
}
