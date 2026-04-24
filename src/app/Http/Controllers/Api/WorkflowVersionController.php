<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\RollbackWorkflowRequest;
use App\Http\Requests\Api\UpdateWorkflowGraphRequest;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\UseCase\Command\CreateWorkflowDraftCommand;
use App\UseCase\Command\DeleteWorkflowVersionCommand;
use App\UseCase\Command\PublishWorkflowVersionCommand;
use App\UseCase\Command\RollbackWorkflowVersionCommand;
use App\UseCase\Command\UpdateWorkflowGraphCommand;
use App\UseCase\Query\WorkflowQueryService;
use App\UseCase\Query\WorkflowVersionQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowVersionController extends Controller
{
    public function __construct(
        private readonly WorkflowVersionQueryService $versions,
        private readonly WorkflowQueryService $workflows,
        private readonly CreateWorkflowDraftCommand $createDraft,
        private readonly UpdateWorkflowGraphCommand $updateGraph,
        private readonly PublishWorkflowVersionCommand $publish,
        private readonly RollbackWorkflowVersionCommand $rollback,
        private readonly DeleteWorkflowVersionCommand $deleteVersion,
    ) {}

    public function show(Request $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $this->authorize('view', $workflowVersion);

        return response()->json(['data' => $this->versions->detailForApi($workflowVersion)]);
    }

    public function createDraft(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('createDraft', $workflow);

        $response = $this->createDraft->execute($request->user(), $workflow);

        return response()->json(['data' => $response->jsonSerialize()], 201);
    }

    public function updateGraph(UpdateWorkflowGraphRequest $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $this->authorize('updateGraph', $workflowVersion);

        $response = $this->updateGraph->execute(
            $request->user(),
            $workflowVersion,
            $request->toDto(),
        );

        return response()->json(['data' => $response->toApiArray()]);
    }

    public function publish(Request $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $this->authorize('publish', $workflowVersion);

        $response = $this->publish->execute($request->user(), $workflowVersion);

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function rollback(RollbackWorkflowRequest $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('rollback', $workflow);

        $target = $this->workflows->findRollbackTarget($request->integer('to_version_id'));
        $response = $this->rollback->execute($request->user(), $workflow, $target);

        return response()->json(['data' => $response->jsonSerialize()], 201);
    }

    public function destroy(Request $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $this->authorize('delete', $workflowVersion);

        $this->deleteVersion->execute($request->user(), $workflowVersion);

        return response()->json(null, 204);
    }
}
