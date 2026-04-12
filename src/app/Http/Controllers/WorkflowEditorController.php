<?php

namespace App\Http\Controllers;

use App\Models\Workflow;
use App\Support\ActivityFeed;
use App\Support\PermissionList;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowEditorController extends Controller
{
    public function __construct(private readonly ActivityFeed $activityFeed)
    {
    }

    public function __invoke(Request $request, Workflow $workflow): Response
    {
        abort_unless($request->user()->can(PermissionList::WORKFLOWS_VIEW), 403);

        $workflow->load([
            'project',
            'latestVersion.creator',
            'latestVersion.screens.customFields',
            'versions' => fn ($query) => $query->with('creator')->orderByDesc('version_number'),
        ]);

        $projectWorkflows = $workflow->project
            ->workflows()
            ->select(['id', 'name', 'status'])
            ->orderBy('name')
            ->get();

        return Inertia::render('WorkflowEditor', [
            'workflow' => $workflow,
            'recentActivity' => $this->activityFeed->latestForWorkflow($workflow),
            'projectWorkflows' => $projectWorkflows,
        ]);
    }
}
