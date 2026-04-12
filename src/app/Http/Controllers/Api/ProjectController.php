<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\EnsuresPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreProjectRequest;
use App\Http\Requests\Api\UpdateProjectRequest;
use App\Models\Project;
use App\Services\Audit\AuditLogger;
use App\Support\PermissionList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    use EnsuresPermission;

    public function index(Request $request): JsonResponse
    {
        $this->ensurePermission($request->user(), PermissionList::PROJECTS_VIEW);

        $projects = Project::query()
            ->withCount('workflows')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $projects]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->ensurePermission($request->user(), PermissionList::PROJECTS_MANAGE);

        $project = Project::query()->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        AuditLogger::log($request->user(), $project, 'created', 'Project created');

        return response()->json(['data' => $project], 201);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        $this->ensurePermission($request->user(), PermissionList::PROJECTS_VIEW);

        $project->load('workflows.latestVersion');

        return response()->json(['data' => $project]);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $this->ensurePermission($request->user(), PermissionList::PROJECTS_MANAGE);

        $project->update($request->validated());

        AuditLogger::log($request->user(), $project, 'updated', 'Project updated');

        return response()->json(['data' => $project]);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->ensurePermission($request->user(), PermissionList::PROJECTS_MANAGE);

        $project->delete();

        AuditLogger::log($request->user(), $project, 'deleted', 'Project deleted');

        return response()->json(status: 204);
    }
}
