<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreWorkflowRequest;
use App\Http\Requests\Api\UpdateWorkflowRequest;
use App\Models\Project;
use App\Models\Workflow;
use App\Services\Audit\AuditLogger;
use App\Services\ProjectAccessService;
use App\Services\Workflow\WorkflowVersionManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowController extends Controller
{
    public function __construct(
        private readonly WorkflowVersionManager $versionManager,
        private readonly ProjectAccessService $access,
    ) {
    }

    public function index(Request $request, Project $project): JsonResponse
    {
        abort_unless($this->access->canView($request->user(), $project), 403, 'Forbidden.');

        $workflows = $project
            ->workflows()
            ->with(['latestVersion', 'publishedVersion'])
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $workflows]);
    }

    public function store(StoreWorkflowRequest $request, Project $project): JsonResponse
    {
        abort_unless($this->access->canEdit($request->user(), $project), 403, 'Forbidden.');

        $workflow = $project->workflows()->create([
            'name' => $request->validated('name'),
            'status' => 'draft',
        ]);

        $initialVersion = $this->versionManager->createInitialVersion($workflow, $request->user());

        AuditLogger::log($request->user(), $workflow, 'created', 'Workflow created', [
            'initial_version_id' => $initialVersion->id,
        ]);

        return response()->json([
            'data' => $workflow->fresh(['latestVersion', 'publishedVersion']),
        ], 201);
    }

    public function show(Request $request, Workflow $workflow): JsonResponse
    {
        $workflow->loadMissing('project');
        abort_unless($this->access->canView($request->user(), $workflow->project), 403, 'Forbidden.');

        $workflow->load([
            'project',
            'latestVersion.screens.customFields',
            'publishedVersion',
            'versions' => fn ($query) => $query->orderByDesc('version_number'),
        ]);

        return response()->json(['data' => $workflow]);
    }

    public function update(UpdateWorkflowRequest $request, Workflow $workflow): JsonResponse
    {
        $workflow->loadMissing('project');
        abort_unless($this->access->canEdit($request->user(), $workflow->project), 403, 'Forbidden.');

        $workflow->update($request->validated());

        AuditLogger::log($request->user(), $workflow, 'updated', 'Workflow updated');

        return response()->json(['data' => $workflow]);
    }
}
