<?php

namespace App\UseCase\Query;

use App\Models\Project;
use App\Models\User;
use App\Support\PermissionList;
use Illuminate\Database\Eloquent\Builder;

final class ProjectQueryService
{
    /**
     * @return Builder<Project>
     */
    public function accessibleQuery(User $user): Builder
    {
        return Project::query()->when(
            ! $user->can(PermissionList::PROJECTS_ADMIN),
            fn (Builder $query) => $query->where(function (Builder $q) use ($user): void
            {
                $q->where(function (Builder $public): void
                {
                    $public->where('is_public', true)
                        ->whereNull('archived_at');
                })
                    ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
            }),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function listForApi(User $user, int $page = 1, int $perPage = 20, ?string $search = null, bool $includeArchived = false): array
    {
        $query = $this->accessibleQuery($user);

        if (! $includeArchived)
        {
            $query->notArchived();
        }

        if ($search)
        {
            $query->where(function (Builder $q) use ($search): void
            {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $paginator = $query->withCount('workflows')
            ->orderBy('name')
            ->paginate(perPage: $perPage, page: $page);

        return [
            'data'         => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'total'        => $paginator->total(),
            'from'         => $paginator->firstItem(),
            'to'           => $paginator->lastItem(),
        ];
    }

    public function detailForApi(Project $project): Project
    {
        return $project->load('workflows.latestRevision');
    }
}
