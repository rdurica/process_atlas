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

        $user = $this->user();
        $isAdmin = $user->can(PermissionList::PROJECTS_ADMIN);
        $currentUserRole = $isAdmin ? 'process_owner' : $user->projectRoleIn($project);

        if ($currentUserRole === null && $project->isPublic())
        {
            $currentUserRole = 'viewer';
        }

        $page = (int) $request->input('page', 1);
        $search = $request->input('search');
        $status = $request->input('status');
        $includeArchived = $request->boolean('include_archived');

        $workflowsQuery = $project->workflows()
            ->when(! $includeArchived, fn ($q) => $q->notArchived())
            ->when($search, fn ($q) => $q->where('name', 'ilike', "%{$search}%"))
            ->when($status && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->with(['latestRevision', 'publishedRevision'])
            ->orderBy('name');

        $paginator = $workflowsQuery->paginate(perPage: 20, page: $page);

        $workflows = [];
        foreach ($paginator->items() as $workflow)
        {
            /** @var Workflow $workflow */
            $workflows[] = [
                'id'              => $workflow->uuid,
                'name'            => $workflow->name,
                'status'          => $workflow->status,
                'latest_revision' => $workflow->latestRevision ? [
                    'id'              => $workflow->latestRevision->uuid,
                    'revision_number' => $workflow->latestRevision->revision_number,
                    'is_published'    => $workflow->latestRevision->is_published,
                ] : null,
                'published_revision' => $workflow->publishedRevision ? [
                    'id'              => $workflow->publishedRevision->uuid,
                    'revision_number' => $workflow->publishedRevision->revision_number,
                ] : null,
                'updated_at'  => $workflow->updated_at !== null ? $workflow->updated_at->toIso8601String() : null, // @phpstan-ignore method.nonObject
                'archived_at' => $workflow->archived_at !== null ? $workflow->archived_at->toIso8601String() : null, // @phpstan-ignore method.nonObject
            ];
        }

        return Inertia::render('ProjectWorkflows', [
            'project' => [
                'id'                => $project->uuid,
                'name'              => $project->name,
                'description'       => $project->description,
                'is_public'         => $project->is_public,
                'archived_at'       => $project->archived_at !== null ? $project->archived_at->toIso8601String() : null, // @phpstan-ignore method.nonObject
                'workflows_count'   => $project->workflows()->notArchived()->count(),
                'current_user_role' => $currentUserRole,
            ],
            'workflows'    => $workflows,
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'total'        => $paginator->total(),
            'from'         => $paginator->firstItem(),
            'to'           => $paginator->lastItem(),
        ]);
    }
}
