<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreProjectRequest;
use App\Http\Requests\Api\UpdateProjectRequest;
use App\Models\Project;
use App\UseCase\Command\ArchiveProjectCommand;
use App\UseCase\Command\CreateProjectCommand;
use App\UseCase\Command\DeleteProjectCommand;
use App\UseCase\Command\UnarchiveProjectCommand;
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
        private readonly ArchiveProjectCommand $archiveProject,
        private readonly UnarchiveProjectCommand $unarchiveProject,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page'             => ['nullable', 'integer', 'min:1'],
            'per_page'         => ['nullable', 'integer', 'min:1', 'max:100'],
            'search'           => ['nullable', 'string', 'max:120'],
            'include_archived' => ['nullable', 'boolean'],
        ]);

        $page = (int) ($validated['page'] ?? 1);
        $perPage = (int) ($validated['per_page'] ?? 20);
        $search = $validated['search'] ?? null;
        $includeArchived = $request->boolean('include_archived');

        return response()->json(
            $this->projects->listForApi($this->user(), $page, $perPage, $search, $includeArchived),
        );
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $response = $this->createProject->execute($this->user(), $request->toDto());

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

        $response = $this->updateProject->execute($this->user(), $project, $request->toDto());

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        $this->deleteProject->execute($this->user(), $project);

        return response()->json(status: 204);
    }

    public function archive(Request $request, Project $project): JsonResponse
    {
        $this->authorize('archive', $project);

        $this->archiveProject->execute($this->user(), $project);

        return response()->json(['data' => ['archived_at' => now()->toIso8601String()]]);
    }

    public function unarchive(Request $request, Project $project): JsonResponse
    {
        $this->authorize('unarchive', $project);

        $this->unarchiveProject->execute($this->user(), $project);

        return response()->json(['data' => ['archived_at' => null]]);
    }
}
