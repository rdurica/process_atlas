<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Services\ProjectAccessService;
use App\Support\PermissionList;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly ProjectAccessService $access)
    {
    }

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $isAdmin = $user->can(PermissionList::PROJECTS_ADMIN);

        $projects = Project::query()
            ->when(
                ! $isAdmin,
                fn ($query) => $query->whereHas(
                    'members',
                    fn ($q) => $q->where('user_id', $user->id)
                )
            )
            ->with([
                'workflows' => fn ($query) => $query->with(['latestVersion', 'publishedVersion'])->orderBy('name'),
            ])
            ->withCount('workflows')
            ->orderBy('name')
            ->get();

        $projectIds = $projects->pluck('id');

        $summary = [
            'projects' => $projects->count(),
            'workflows' => Workflow::query()->whereIn('project_id', $projectIds)->count(),
            'draft_versions' => WorkflowVersion::query()
                ->whereHas('workflow', fn ($q) => $q->whereIn('project_id', $projectIds))
                ->where('is_published', false)
                ->count(),
            'published_workflows' => Workflow::query()
                ->whereIn('project_id', $projectIds)
                ->where('status', 'published')
                ->count(),
        ];

        return Inertia::render('Dashboard', [
            'summary' => $summary,
            'projects' => $projects->map(function (Project $project) use ($user, $isAdmin): array {
                $publishedCount = $project->workflows->where('status', 'published')->count();
                $draftCount = $project->workflows->where('status', 'draft')->count();
                $latestVersionNumber = $project->workflows
                    ->pluck('latestVersion.version_number')
                    ->filter()
                    ->max();

                $currentUserRole = $isAdmin
                    ? 'process_owner'
                    : $user->projectRoleIn($project);

                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description,
                    'workflows_count' => $project->workflows_count,
                    'latest_version_label' => $latestVersionNumber ? 'v'.$latestVersionNumber : 'Not started',
                    'status_summary' => match (true) {
                        $project->workflows_count === 0 => 'No workflows',
                        $publishedCount > 0 && $draftCount > 0 => $publishedCount.' published / '.$draftCount.' draft',
                        $publishedCount > 0 => $publishedCount.' published',
                        default => $draftCount.' draft',
                    },
                    'current_user_role' => $currentUserRole,
                    'workflows' => $project->workflows->map(fn (Workflow $workflow): array => [
                        'id' => $workflow->id,
                        'name' => $workflow->name,
                        'status' => $workflow->status,
                        'latest_version' => $workflow->latestVersion ? [
                            'id' => $workflow->latestVersion->id,
                            'version_number' => $workflow->latestVersion->version_number,
                            'is_published' => $workflow->latestVersion->is_published,
                        ] : null,
                        'published_version_id' => $workflow->published_version_id,
                        'updated_at' => $workflow->updated_at?->toIso8601String(),
                    ])->values()->all(),
                ];
            })->values()->all(),
        ]);
    }
}
