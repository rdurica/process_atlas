<?php

namespace App\UseCase\Query;

use App\Models\Project;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowRevision;
use App\Support\PermissionList;

final class DashboardQueryService
{
    /**
     * @return array{summary: array<string, int>, projects: array<int, array<string, mixed>>}
     */
    public function getDashboardData(User $user): array
    {
        $isAdmin = $user->can(PermissionList::PROJECTS_ADMIN);

        $projects = Project::query()
            ->when(
                ! $isAdmin,
                fn ($query) => $query->whereHas(
                    'members',
                    fn ($q) => $q->where('user_id', $user->id),
                ),
            )
            ->with([
                'workflows' => fn ($query) => $query->with(['latestRevision', 'publishedRevision'])->orderBy('name'),
            ])
            ->withCount('workflows')
            ->orderBy('name')
            ->get();

        $projectIds = $projects->pluck('id');

        $allWorkflows = Workflow::query()
            ->whereIn('project_id', $projectIds)
            ->with(['latestRevision', 'publishedRevision'])
            ->get();

        $summary = [
            'projects'             => $projects->count(),
            'workflows'            => $allWorkflows->count(),
            'unreleased_workflows' => $allWorkflows
                ->filter(fn (Workflow $w) => $w->latestRevision && ! $w->latestRevision->is_published)
                ->count(),
            'released_workflows' => $allWorkflows->whereNotNull('published_revision_id')->count(),
        ];

        $serializedProjects = $projects->map(function (Project $project) use ($user, $isAdmin): array
        {
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

            $latestRevisionLabel = 'Not started';
            if ($latestRevision instanceof WorkflowRevision)
            {
                $latestRevisionLabel = $latestRevision->revision_number !== null
                    ? 'rev. ' . $latestRevision->revision_number
                    : ($latestRevision->draft_name ?? 'Draft');
            }

            return [
                'id'                    => $project->id,
                'name'                  => $project->name,
                'description'           => $project->description,
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
                'workflows'         => $project->workflows->map(fn (Workflow $workflow): array => [
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
                    'updated_at' => $workflow->updated_at?->toIso8601String(),
                ])->values()->all(),
            ];
        })->values()->all();

        return [
            'summary'  => $summary,
            'projects' => $serializedProjects,
        ];
    }
}
