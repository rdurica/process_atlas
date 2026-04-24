<?php

namespace App\Http\Controllers\Api;

use App\Actions\WorkflowActionService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreWorkflowRequest;
use App\Http\Requests\Api\UpdateWorkflowRequest;
use App\Models\Project;
use App\Models\Workflow;
use App\Queries\WorkflowQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class WorkflowController extends Controller
{
    public function __construct(
        private readonly WorkflowQueryService $workflows,
        private readonly WorkflowActionService $actions,
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

        $workflow = $this->actions->create($request->user(), $project, $request->toDto());

        return response()->json(['data' => $workflow], 201);
    }

    public function show(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('view', $workflow);

        return response()->json(['data' => $this->workflows->detailForApi($workflow)]);
    }

    public function update(UpdateWorkflowRequest $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('update', $workflow);

        return response()->json([
            'data' => $this->actions->update($request->user(), $workflow, $request->toDto()),
        ]);
    }

    public function archive(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('archive', $workflow);

        $this->actions->archive($request->user(), $workflow);

        $workflow->refresh();

        /** @var Carbon|null $archivedAt */
        $archivedAt = $workflow->archived_at;

        return response()->json(['data' => ['archived_at' => $archivedAt?->toIso8601String()]]);
    }

    public function unarchive(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('archive', $workflow);

        $this->actions->unarchive($request->user(), $workflow);

        $workflow->refresh();

        return response()->json(['data' => ['archived_at' => $workflow->archived_at]]);
    }
}
