<?php

namespace App\Http\Controllers\Api;

use App\Actions\WorkflowVersionActionService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\RollbackWorkflowRequest;
use App\Http\Requests\Api\UpdateWorkflowGraphRequest;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Queries\WorkflowQueryService;
use App\Queries\WorkflowVersionQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowVersionController extends Controller
{
    public function __construct(
        private readonly WorkflowVersionQueryService $versions,
        private readonly WorkflowQueryService $workflows,
        private readonly WorkflowVersionActionService $actions,
    ) {}

    public function show(Request $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $this->authorize('view', $workflowVersion);

        return response()->json(['data' => $this->versions->detailForApi($workflowVersion)]);
    }

    public function createDraft(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('createDraft', $workflow);

        $version = $this->actions->createDraft($request->user(), $workflow);

        return response()->json(['data' => $version], 201);
    }

    public function updateGraph(UpdateWorkflowGraphRequest $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $this->authorize('updateGraph', $workflowVersion);

        $payload = $this->actions->updateGraph(
            $request->user(),
            $workflowVersion,
            $request->toDto(),
        );

        return response()->json(['data' => $payload->toApiArray()]);
    }

    public function publish(Request $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $this->authorize('publish', $workflowVersion);

        return response()->json([
            'data' => $this->actions->publish($request->user(), $workflowVersion),
        ]);
    }

    public function rollback(RollbackWorkflowRequest $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('rollback', $workflow);

        $target = $this->workflows->findRollbackTarget($request->integer('to_version_id'));
        $newVersion = $this->actions->rollback($request->user(), $workflow, $target);

        return response()->json(['data' => $newVersion], 201);
    }

    public function destroy(Request $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $this->authorize('delete', $workflowVersion);

        $this->actions->delete($request->user(), $workflowVersion);

        return response()->json(null, 204);
    }
}
