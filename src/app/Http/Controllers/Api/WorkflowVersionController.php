<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\RollbackWorkflowRequest;
use App\Http\Requests\Api\UpdateWorkflowGraphRequest;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Services\Audit\AuditLogger;
use App\Services\ProjectAccessService;
use App\Services\Workflow\WorkflowVersionManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowVersionController extends Controller
{
    public function __construct(
        private readonly WorkflowVersionManager $versionManager,
        private readonly ProjectAccessService $access,
    ) {
    }

    public function show(Request $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $workflowVersion->loadMissing('workflow.project');
        abort_unless($this->access->canView($request->user(), $workflowVersion->workflow->project), 403, 'Forbidden.');

        $workflowVersion->load(['screens.customFields', 'workflow']);

        return response()->json(['data' => $workflowVersion]);
    }

    public function createDraft(Request $request, Workflow $workflow): JsonResponse
    {
        $workflow->loadMissing('project');
        abort_unless($this->access->canEdit($request->user(), $workflow->project), 403, 'Forbidden.');

        $version = $this->versionManager->createDraftFromLatest($workflow, $request->user());

        AuditLogger::log($request->user(), $version, 'created', 'Draft workflow version created', [
            'workflow_id' => $workflow->id,
        ]);

        return response()->json(['data' => $version], 201);
    }

    public function updateGraph(UpdateWorkflowGraphRequest $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $workflowVersion->loadMissing('workflow.project');
        abort_unless($this->access->canEdit($request->user(), $workflowVersion->workflow->project), 403, 'Forbidden.');
        abort_if($workflowVersion->is_published, 422, 'Cannot modify a published version.');

        $lockVersion = $request->integer('lock_version');
        abort_if($lockVersion !== $workflowVersion->lock_version, 409, 'Version conflict. Reload and retry.');

        $workflowVersion->update([
            'graph_json' => $request->validated('graph_json'),
            'lock_version' => $workflowVersion->lock_version + 1,
        ]);

        AuditLogger::log($request->user(), $workflowVersion, 'updated', 'Workflow graph updated');

        return response()->json([
            'data' => [
                'workflow_version_id' => $workflowVersion->id,
                'lock_version' => $workflowVersion->lock_version,
            ],
        ]);
    }

    public function publish(Request $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $workflowVersion->loadMissing('workflow.project');
        abort_unless($this->access->canPublish($request->user(), $workflowVersion->workflow->project), 403, 'Forbidden.');

        $this->versionManager->publishVersion($workflowVersion);

        AuditLogger::log($request->user(), $workflowVersion, 'published', 'Workflow version published', [
            'workflow_id' => $workflowVersion->workflow_id,
        ]);

        return response()->json(['data' => $workflowVersion->fresh()]);
    }

    public function rollback(RollbackWorkflowRequest $request, Workflow $workflow): JsonResponse
    {
        $workflow->loadMissing('project');
        abort_unless($this->access->canPublish($request->user(), $workflow->project), 403, 'Forbidden.');

        $target = WorkflowVersion::query()->findOrFail($request->integer('to_version_id'));

        $newVersion = $this->versionManager->rollbackToVersion($workflow, $target, $request->user());

        AuditLogger::log($request->user(), $newVersion, 'created', 'Rollback draft created', [
            'workflow_id' => $workflow->id,
            'source_version_id' => $target->id,
        ]);

        return response()->json(['data' => $newVersion], 201);
    }

    public function destroy(Request $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $workflowVersion->loadMissing('workflow.project');
        abort_unless($this->access->canPublish($request->user(), $workflowVersion->workflow->project), 403, 'Forbidden.');

        $versionNumber = $workflowVersion->version_number;
        $workflowId = $workflowVersion->workflow_id;

        $this->versionManager->deleteVersion($workflowVersion->workflow, $workflowVersion);

        AuditLogger::log($request->user(), $workflowVersion->workflow, 'deleted', 'Workflow version deleted', [
            'version_id' => $workflowVersion->id,
            'version_number' => $versionNumber,
            'workflow_id' => $workflowId,
        ]);

        return response()->json(null, 204);
    }
}
