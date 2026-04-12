<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreProjectRequest;
use App\Http\Requests\Api\UpdateProjectRequest;
use App\Models\Project;
use App\Services\Audit\AuditLogger;
use App\Services\ProjectAccessService;
use App\Support\PermissionList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(private readonly ProjectAccessService $access)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $projects = Project::query()
            ->when(
                ! $user->can(PermissionList::PROJECTS_ADMIN),
                fn ($query) => $query->whereHas(
                    'members',
                    fn ($q) => $q->where('user_id', $user->id)
                )
            )
            ->withCount('workflows')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $projects]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        abort_unless($request->user()->can(PermissionList::PROJECTS_CREATE), 403, 'Forbidden.');

        $project = Project::query()->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        // Creator automatically becomes process_owner of the new project
        $project->members()->attach($request->user()->id, ['role' => 'process_owner']);

        AuditLogger::log($request->user(), $project, 'created', 'Project created');

        return response()->json(['data' => $project], 201);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        abort_unless($this->access->canView($request->user(), $project), 403, 'Forbidden.');

        $project->load('workflows.latestVersion');

        return response()->json(['data' => $project]);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        abort_unless($this->access->canManageMembers($request->user(), $project), 403, 'Forbidden.');

        $project->update($request->validated());

        AuditLogger::log($request->user(), $project, 'updated', 'Project updated');

        return response()->json(['data' => $project]);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        abort_unless($this->access->canManageMembers($request->user(), $project), 403, 'Forbidden.');

        $project->delete();

        AuditLogger::log($request->user(), $project, 'deleted', 'Project deleted');

        return response()->json(status: 204);
    }
}
