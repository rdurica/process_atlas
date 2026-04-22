<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Workflow;
use App\Support\PermissionList;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Dashboard');
    }

    public function show(Request $request, Project $project): Response
    {
        $this->authorize('view', $project);

        $user = $request->user();
        $isAdmin = $user->can(PermissionList::PROJECTS_ADMIN);
        $currentUserRole = $isAdmin ? 'process_owner' : $user->projectRoleIn($project);

        $workflows = $project->workflows()
            ->with(['latestVersion', 'publishedVersion'])
            ->orderBy('name')
            ->get()
            ->map(fn (Workflow $workflow): array => [
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
            ])
            ->values()
            ->all();

        return Inertia::render('ProjectWorkflows', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'workflows_count' => $project->workflows()->count(),
                'current_user_role' => $currentUserRole,
            ],
            'workflows' => $workflows,
        ]);
    }
}
