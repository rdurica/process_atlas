<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreProjectRequest;
use App\Http\Requests\Api\UpdateProjectRequest;
use App\Models\Project;
use App\UseCase\Command\CreateProjectCommand;
use App\UseCase\Command\DeleteProjectCommand;
use App\UseCase\Command\UpdateProjectCommand;
use App\UseCase\Query\ProjectQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(
        private readonly ProjectQueryService $projects,
        private readonly CreateProjectCommand $createProject,
        private readonly UpdateProjectCommand $updateProject,
        private readonly DeleteProjectCommand $deleteProject,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->projects->listForApi($request->user())]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $response = $this->createProject->execute($request->user(), $request->toDto());

        return response()->json(['data' => $response->jsonSerialize()], 201);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json(['data' => $this->projects->detailForApi($project)]);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $response = $this->updateProject->execute($request->user(), $project, $request->toDto());

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        $this->deleteProject->execute($request->user(), $project);

        return response()->json(status: 204);
    }
}
