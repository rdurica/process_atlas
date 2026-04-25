<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\RollbackWorkflowRequest;
use App\Http\Requests\Api\UpdateWorkflowGraphRequest;
use App\Models\Workflow;
use App\Models\WorkflowRevision;
use App\UseCase\Command\CreateWorkflowDraftCommand;
use App\UseCase\Command\DeleteWorkflowRevisionCommand;
use App\UseCase\Command\PublishWorkflowRevisionCommand;
use App\UseCase\Command\RollbackWorkflowRevisionCommand;
use App\UseCase\Command\UpdateWorkflowGraphCommand;
use App\UseCase\Query\WorkflowQueryService;
use App\UseCase\Query\WorkflowRevisionQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowRevisionController extends Controller
{
    public function __construct(
        private readonly WorkflowRevisionQueryService $revisions,
        private readonly WorkflowQueryService $workflows,
        private readonly CreateWorkflowDraftCommand $createDraft,
        private readonly UpdateWorkflowGraphCommand $updateGraph,
        private readonly PublishWorkflowRevisionCommand $publish,
        private readonly RollbackWorkflowRevisionCommand $rollback,
        private readonly DeleteWorkflowRevisionCommand $deleteRevision,
    ) {}

    public function show(Request $request, WorkflowRevision $workflowRevision): JsonResponse
    {
        $this->authorize('view', $workflowRevision);

        return response()->json(['data' => $this->revisions->detailForApi($workflowRevision)]);
    }

    public function createDraft(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('createDraft', $workflow);

        $response = $this->createDraft->execute($this->user(), $workflow);

        return response()->json(['data' => $response->jsonSerialize()], 201);
    }

    public function updateGraph(UpdateWorkflowGraphRequest $request, WorkflowRevision $workflowRevision): JsonResponse
    {
        $this->authorize('updateGraph', $workflowRevision);

        $response = $this->updateGraph->execute(
            $this->user(),
            $workflowRevision,
            $request->toDto(),
        );

        return response()->json(['data' => $response->toApiArray()]);
    }

    public function publish(Request $request, WorkflowRevision $workflowRevision): JsonResponse
    {
        $this->authorize('publish', $workflowRevision);

        $response = $this->publish->execute($this->user(), $workflowRevision);

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function rollback(RollbackWorkflowRequest $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('rollback', $workflow);

        $target = $this->workflows->findRollbackTarget($request->integer('to_version_id'));
        $response = $this->rollback->execute($this->user(), $workflow, $target);

        return response()->json(['data' => $response->jsonSerialize()], 201);
    }

    public function destroy(Request $request, WorkflowRevision $workflowRevision): JsonResponse
    {
        $this->authorize('delete', $workflowRevision);

        $this->deleteRevision->execute($this->user(), $workflowRevision);

        return response()->json(null, 204);
    }
}
