<?php

namespace App\Queries;

use App\Models\Project;
use App\Models\User;
use App\Support\PermissionList;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final class ProjectQueryService
{
    /**
     * @return Builder<Project>
     */
    public function accessibleQuery(User $user): Builder
    {
        return Project::query()->when(
            ! $user->can(PermissionList::PROJECTS_ADMIN),
            fn (Builder $query) => $query->whereHas('members', fn ($q) => $q->where('user_id', $user->id))
        );
    }

    /**
     * @return Collection<int, Project>
     */
    public function listForApi(User $user): Collection
    {
        return $this->accessibleQuery($user)
            ->withCount('workflows')
            ->orderBy('id')
            ->get();
    }

    public function detailForApi(Project $project): Project
    {
        return $project->load('workflows.latestVersion');
    }
}
