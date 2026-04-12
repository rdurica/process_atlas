<?php

namespace App\Http\Controllers;

use App\Models\Workflow;
use App\Services\ProjectAccessService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowEditorController extends Controller
{
    public function __construct(private readonly ProjectAccessService $access)
    {
    }

    public function __invoke(Request $request, Workflow $workflow): Response
    {
        $workflow->load('project');
        abort_unless($this->access->canView($request->user(), $workflow->project), 403);

        $workflow->load([
            'latestVersion.creator',
            'latestVersion.screens.customFields',
            'versions' => fn ($query) => $query->with('creator')->orderByDesc('version_number'),
        ]);

        $projectWorkflows = $workflow->project
            ->workflows()
            ->select(['id', 'name', 'status'])
            ->orderBy('name')
            ->get();

        $user = $request->user();
        $currentUserRole = $user->isAdmin()
            ? 'process_owner'
            : $user->projectRoleIn($workflow->project);

        return Inertia::render('WorkflowEditor', [
            'workflow' => $workflow,
            'projectWorkflows' => $projectWorkflows,
            'currentUserRole' => $currentUserRole,
        ]);
    }
}
