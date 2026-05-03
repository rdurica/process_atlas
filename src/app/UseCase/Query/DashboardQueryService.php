<?php

namespace App\UseCase\Query;

use App\Models\Project;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowRevision;
use App\Support\PermissionList;
use Illuminate\Support\Collection;

final class DashboardQueryService
{
    /**
     * @return array<string, mixed>
     */
    public function getDashboardData(User $user, int $page = 1, int $perPage = 20, ?string $search = null, ?string $statusFilter = null, bool $includeArchived = false): array
    {
        $isAdmin = $user->can(PermissionList::PROJECTS_ADMIN);

        $query = Project::query()
            ->when(
                ! $isAdmin,
                fn ($query) => $query->where(function ($q) use ($user): void
                {
                    $q->where('is_public', true)
                        ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
                }),
            );

        if (! $includeArchived)
        {
            $query->notArchived();
        }

        if ($search)
        {
            $query->where(function ($q) use ($search): void
            {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $allAccessibleProjects = $query->clone()->pluck('id');

        $allWorkflows = Workflow::query()
            ->whereIn('project_id', $allAccessibleProjects)
            ->with(['latestRevision', 'publishedRevision'])
            ->get();

        $summary = [
            'projects'             => $allAccessibleProjects->count(),
            'workflows'            => $allWorkflows->count(),
            'unreleased_workflows' => $allWorkflows
                ->filter(fn (Workflow $w) => $w->latestRevision && ! $w->latestRevision->is_published)
                ->count(),
            'released_workflows' => $allWorkflows->whereNotNull('published_revision_id')->count(),
        ];

        // Apply status filter before pagination
        if ($statusFilter && $statusFilter !== 'all')
        {
            $projectIdsWithStatus = $this->filterProjectsByStatus($allWorkflows, $statusFilter);
            $query->whereIn('id', $projectIdsWithStatus);
        }

        $paginator = $query->with([
            'workflows' => fn ($q) => $q->with(['latestRevision', 'publishedRevision'])->orderBy('name'),
        ])
            ->withCount('workflows')
            ->orderBy('name')
            ->paginate(perPage: $perPage, page: $page);

        $serializedProjects = [];
        foreach ($paginator->items() as $project)
        {
            /** @var Project $project */
            $publishedCount = $project->workflows->whereNotNull('published_revision_id')->count();
            $draftCount = $project->workflows->filter(
                fn (Workflow $w) => $w->latestRevision && ! $w->latestRevision->is_published,
            )->count();
            $latestRevision = $project->workflows
                ->pluck('latestRevision')
                ->filter()
                ->sortByDesc(fn (?WorkflowRevision $r) => $r?->created_at)
                ->first();

            $currentUserRole = $isAdmin
                ? 'process_owner'
                : $user->projectRoleIn($project);

            if ($currentUserRole === null && $project->isPublic())
            {
                $currentUserRole = 'viewer';
            }

            $latestRevisionLabel = 'Not started';
            if ($latestRevision instanceof WorkflowRevision)
            {
                $latestRevisionLabel = $latestRevision->revision_number !== null
                    ? 'rev. ' . $latestRevision->revision_number
                    : ($latestRevision->draft_name ?? 'Draft');
            }

            $workflows = [];
            foreach ($project->workflows as $workflow)
            {
                $workflows[] = [
                    'id'              => $workflow->id,
                    'name'            => $workflow->name,
                    'status'          => $workflow->status,
                    'latest_revision' => $workflow->latestRevision ? [
                        'id'              => $workflow->latestRevision->id,
                        'revision_number' => $workflow->latestRevision->revision_number,
                        'is_published'    => $workflow->latestRevision->is_published,
                    ] : null,
                    'published_revision' => $workflow->publishedRevision ? [
                        'id'              => $workflow->publishedRevision->id,
                        'revision_number' => $workflow->publishedRevision->revision_number,
                    ] : null,
                    'updated_at' => $workflow->updated_at !== null ? $workflow->updated_at->toIso8601String() : null, // @phpstan-ignore method.nonObject
                ];
            }

            $serializedProjects[] = [
                'id'                    => $project->id,
                'name'                  => $project->name,
                'description'           => $project->description,
                'is_public'             => $project->is_public,
                'archived_at'           => $project->archived_at !== null ? $project->archived_at->toIso8601String() : null, // @phpstan-ignore method.nonObject
                'workflows_count'       => $project->workflows_count,
                'latest_revision_label' => $latestRevisionLabel,
                'status_summary'        => match (true)
                {
                    $project->workflows_count === 0        => 'No workflows',
                    $publishedCount > 0 && $draftCount > 0 => $publishedCount . ' released / ' . $draftCount . ' unreleased',
                    $publishedCount > 0                    => $publishedCount . ' released',
                    default                                => $draftCount . ' unreleased',
                },
                'released_count'    => $publishedCount,
                'unreleased_count'  => $draftCount,
                'current_user_role' => $currentUserRole,
                'workflows'         => $workflows,
            ];
        }

        return [
            'summary'      => $summary,
            'projects'     => $serializedProjects,
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'total'        => $paginator->total(),
            'from'         => $paginator->firstItem(),
            'to'           => $paginator->lastItem(),
        ];
    }

    /**
     * @param  Collection<int, Workflow>  $workflows
     * @return array<int, int>
     */
    private function filterProjectsByStatus($workflows, string $statusFilter): array
    {
        return $workflows
            ->filter(function (Workflow $workflow) use ($statusFilter): bool
            {
                return match ($statusFilter)
                {
                    'empty'     => $workflow->published_revision_id === null && $workflow->latestRevision === null,
                    'published' => $workflow->published_revision_id !== null,
                    'draft'     => $workflow->latestRevision !== null && ! $workflow->latestRevision->is_published,
                    default     => true,
                };
            })
            ->pluck('project_id')
            ->unique()
            ->values()
            ->all();
    }
}
