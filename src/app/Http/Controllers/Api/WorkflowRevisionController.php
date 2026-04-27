<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CreateWorkflowDraftRequest;
use App\Http\Requests\Api\RenameWorkflowDraftRequest;
use App\Http\Requests\Api\UpdateWorkflowGraphRequest;
use App\Models\Workflow;
use App\Models\WorkflowRevision;
use App\UseCase\Command\CreateWorkflowDraftCommand;
use App\UseCase\Command\DeleteWorkflowRevisionCommand;
use App\UseCase\Command\PublishWorkflowRevisionCommand;
use App\UseCase\Command\RenameWorkflowDraftCommand;
use App\UseCase\Command\SwitchToDraftCommand;
use App\UseCase\Command\UpdateWorkflowGraphCommand;
use App\UseCase\Query\WorkflowRevisionQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowRevisionController extends Controller
{
    public function __construct(
        private readonly WorkflowRevisionQueryService $revisions,
        private readonly CreateWorkflowDraftCommand $createDraft,
        private readonly UpdateWorkflowGraphCommand $updateGraph,
        private readonly PublishWorkflowRevisionCommand $publish,
        private readonly RenameWorkflowDraftCommand $renameDraft,
        private readonly DeleteWorkflowRevisionCommand $deleteRevision,
        private readonly SwitchToDraftCommand $switchToDraft,
    ) {}

    public function show(Request $request, WorkflowRevision $workflowRevision): JsonResponse
    {
        $this->authorize('view', $workflowRevision);

        return response()->json(['data' => $this->revisions->detailForApi($workflowRevision)]);
    }

    public function createDraft(CreateWorkflowDraftRequest $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('createDraft', $workflow);

        $response = $this->createDraft->execute(
            $this->user(),
            $workflow,
            $request->input('draft_name'),
            $request->input('source_revision_id') ? (int) $request->input('source_revision_id') : null,
        );

        return response()->json(['data' => $response->jsonSerialize()], 201);
    }

    public function updateGraph(UpdateWorkflowGraphRequest $request, WorkflowRevision $workflowRevision): JsonResponse
    {
        $this->authorize('updateGraph', $workflowRevision);

        $dto = $request->toDto();

        $response = $this->updateGraph->execute(
            $this->user(),
            $workflowRevision,
            $dto,
            $dto->source ?? 'ui',
        );

        return response()->json(['data' => $response->toApiArray()]);
    }

    public function publish(Request $request, WorkflowRevision $workflowRevision): JsonResponse
    {
        $this->authorize('publish', $workflowRevision);

        $response = $this->publish->execute(
            $this->user(),
            $workflowRevision,
            $request->boolean('force'),
        );

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function switchToDraft(Request $request, WorkflowRevision $workflowRevision): JsonResponse
    {
        $this->authorize('updateGraph', $workflowRevision);

        $response = $this->switchToDraft->execute(
            $this->user(),
            $workflowRevision->workflow()->firstOrFail(),
            $workflowRevision,
        );

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function renameDraft(RenameWorkflowDraftRequest $request, WorkflowRevision $workflowRevision): JsonResponse
    {
        $this->authorize('renameDraft', $workflowRevision);

        $response = $this->renameDraft->execute(
            $this->user(),
            $workflowRevision,
            $request->validated('draft_name'),
        );

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function destroy(Request $request, WorkflowRevision $workflowRevision): JsonResponse
    {
        $this->authorize('delete', $workflowRevision);

        $this->deleteRevision->execute($this->user(), $workflowRevision);

        return response()->json(null, 204);
    }
}
