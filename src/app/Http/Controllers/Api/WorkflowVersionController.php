<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\EnsuresPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\RollbackWorkflowRequest;
use App\Http\Requests\Api\UpdateWorkflowGraphRequest;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Services\Audit\AuditLogger;
use App\Services\Workflow\WorkflowVersionManager;
use App\Support\PermissionList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowVersionController extends Controller
{
    use EnsuresPermission;

    public function __construct(private readonly WorkflowVersionManager $versionManager)
    {
    }

    public function show(Request $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $this->ensurePermission($request->user(), PermissionList::WORKFLOWS_VIEW);

        $workflowVersion->load(['screens.customFields', 'workflow']);

        return response()->json(['data' => $workflowVersion]);
    }

    public function createDraft(Request $request, Workflow $workflow): JsonResponse
    {
        $this->ensurePermission($request->user(), PermissionList::WORKFLOWS_EDIT);

        $version = $this->versionManager->createDraftFromLatest($workflow, $request->user());

        AuditLogger::log($request->user(), $version, 'created', 'Draft workflow version created', [
            'workflow_id' => $workflow->id,
        ]);

        return response()->json(['data' => $version], 201);
    }

    public function updateGraph(UpdateWorkflowGraphRequest $request, WorkflowVersion $workflowVersion): JsonResponse
    {
        $this->ensurePermission($request->user(), PermissionList::WORKFLOWS_EDIT);

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
        $this->ensurePermission($request->user(), PermissionList::WORKFLOWS_PUBLISH);

        $this->versionManager->publishVersion($workflowVersion);

        AuditLogger::log($request->user(), $workflowVersion, 'published', 'Workflow version published', [
            'workflow_id' => $workflowVersion->workflow_id,
        ]);

        return response()->json(['data' => $workflowVersion->fresh()]);
    }

    public function rollback(RollbackWorkflowRequest $request, Workflow $workflow): JsonResponse
    {
        $this->ensurePermission($request->user(), PermissionList::WORKFLOWS_PUBLISH);

        $target = WorkflowVersion::query()->findOrFail($request->integer('to_version_id'));

        $newVersion = $this->versionManager->rollbackToVersion($workflow, $target, $request->user());

        AuditLogger::log($request->user(), $newVersion, 'created', 'Rollback draft created', [
            'workflow_id' => $workflow->id,
            'source_version_id' => $target->id,
        ]);

        return response()->json(['data' => $newVersion], 201);
    }
}
