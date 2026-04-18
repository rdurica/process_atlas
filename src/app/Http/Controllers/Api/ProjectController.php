<?php

namespace App\Http\Controllers\Api;

use App\Actions\ProjectActionService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreProjectRequest;
use App\Http\Requests\Api\UpdateProjectRequest;
use App\Models\Project;
use App\Queries\ProjectQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(
        private readonly ProjectQueryService $projects,
        private readonly ProjectActionService $actions,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->projects->listForApi($request->user())]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $project = $this->actions->create($request->user(), $request->toDto());

        return response()->json(['data' => $project], 201);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json(['data' => $this->projects->detailForApi($project)]);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        return response()->json([
            'data' => $this->actions->update($request->user(), $project, $request->toDto()),
        ]);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        $this->actions->delete($request->user(), $project);

        return response()->json(status: 204);
    }
}
