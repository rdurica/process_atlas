<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreWorkflowRequest;
use App\Http\Requests\Api\UpdateWorkflowRequest;
use App\Models\Project;
use App\Models\Workflow;
use App\UseCase\Command\ArchiveWorkflowCommand;
use App\UseCase\Command\CreateWorkflowCommand;
use App\UseCase\Command\UnarchiveWorkflowCommand;
use App\UseCase\Command\UpdateWorkflowCommand;
use App\UseCase\Query\WorkflowQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowController extends Controller
{
    public function __construct(
        private readonly WorkflowQueryService $workflows,
        private readonly CreateWorkflowCommand $createWorkflow,
        private readonly UpdateWorkflowCommand $updateWorkflow,
        private readonly ArchiveWorkflowCommand $archiveWorkflow,
        private readonly UnarchiveWorkflowCommand $unarchiveWorkflow,
    ) {}

    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $includeArchived = $request->boolean('include_archived');

        return response()->json(['data' => $this->workflows->listForProject($project, $includeArchived)]);
    }

    public function store(StoreWorkflowRequest $request, Project $project): JsonResponse
    {
        $this->authorize('editWorkflows', $project);

        $response = $this->createWorkflow->execute($request->user(), $project, $request->toDto());

        return response()->json(['data' => $response->jsonSerialize()], 201);
    }

    public function show(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('view', $workflow);

        return response()->json(['data' => $this->workflows->detailForApi($workflow)]);
    }

    public function update(UpdateWorkflowRequest $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('update', $workflow);

        $response = $this->updateWorkflow->execute($request->user(), $workflow, $request->toDto());

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function archive(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('archive', $workflow);

        $response = $this->archiveWorkflow->execute($request->user(), $workflow);

        return response()->json(['data' => ['archived_at' => $response->archivedAt]]);
    }

    public function unarchive(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('archive', $workflow);

        $response = $this->unarchiveWorkflow->execute($request->user(), $workflow);

        return response()->json(['data' => ['archived_at' => $response->archivedAt]]);
    }
}
