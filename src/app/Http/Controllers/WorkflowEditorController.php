<?php

namespace App\Http\Controllers;

use App\Models\Workflow;
use App\Support\ActivityFeed;
use App\UseCase\Query\WorkflowQueryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowEditorController extends Controller
{
    public function __construct(
        private readonly WorkflowQueryService $workflows,
        private readonly ActivityFeed $activity,
    ) {}

    public function __invoke(Request $request, Workflow $workflow): Response
    {
        $this->authorize('view', $workflow);

        return Inertia::render('WorkflowEditor', [
            'workflow'         => $this->workflows->detailForEditor($workflow),
            'projectWorkflows' => $this->workflows->projectWorkflowsForEditor($workflow),
            'currentUserRole'  => $this->workflows->currentUserRoleForWorkflow($this->user(), $workflow),
            'recentActivity'   => $this->activity->latestForWorkflow($workflow),
        ]);
    }
}
