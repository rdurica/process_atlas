<?php

namespace App\Queries;

use App\Models\Project;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Models\User;
use Illuminate\Support\Collection;

final class WorkflowQueryService
{
    /**
     * @return Collection<int, Workflow>
     */
    public function listForProject(Project $project): Collection
    {
        return $project
            ->workflows()
            ->with(['latestVersion', 'publishedVersion'])
            ->orderBy('id')
            ->get();
    }

    public function detailForApi(Workflow $workflow): Workflow
    {
        return $workflow->load([
            'project',
            'latestVersion.screens.customFields',
            'publishedVersion',
            'versions' => fn ($query) => $query->orderByDesc('version_number'),
        ]);
    }

    public function detailForEditor(Workflow $workflow): Workflow
    {
        return $workflow->load([
            'project',
            'latestVersion.creator',
            'latestVersion.screens.customFields',
            'versions' => fn ($query) => $query->with('creator')->orderByDesc('version_number'),
        ]);
    }

    /**
     * @return Collection<int, Workflow>
     */
    public function projectWorkflowsForEditor(Workflow $workflow): Collection
    {
        $workflow->loadMissing('project');

        return $workflow->project
            ->workflows()
            ->select(['id', 'name', 'status'])
            ->orderBy('name')
            ->get();
    }

    public function currentUserRoleForWorkflow(User $user, Workflow $workflow): string
    {
        $workflow->loadMissing('project');

        return $user->isAdmin()
            ? 'process_owner'
            : (string) $user->projectRoleIn($workflow->project);
    }

    public function findRollbackTarget(int $workflowVersionId): WorkflowVersion
    {
        return WorkflowVersion::query()->findOrFail($workflowVersionId);
    }
}
