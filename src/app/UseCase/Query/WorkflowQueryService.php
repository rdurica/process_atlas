<?php

namespace App\UseCase\Query;

use App\Models\Project;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Services\Cache\PublishedWorkflowCacheService;
use Illuminate\Support\Collection;

final class WorkflowQueryService
{
    public function __construct(private readonly PublishedWorkflowCacheService $cache) {}

    /**
     * @return Collection<int, Workflow>
     */
    public function listForProject(Project $project, bool $includeArchived = false): Collection
    {
        $query = $project
            ->workflows()
            ->with(['latestVersion', 'publishedVersion'])
            ->orderBy('id');

        if (! $includeArchived)
        {
            $query->notArchived();
        }

        return $query->get();
    }

    public function detailForApi(Workflow $workflow): Workflow|array
    {
        if ($workflow->published_version_id !== null)
        {
            $cached = $this->cache->get($workflow->id);

            if ($cached !== null)
            {
                return $cached;
            }

            $workflow->load([
                'project',
                'latestVersion.screens.customFields',
                'publishedVersion.screens.customFields',
                'versions' => fn ($query) => $query->orderByDesc('version_number'),
            ]);

            $this->cache->put($workflow->id, $workflow->toArray());

            return $workflow;
        }

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
            ->notArchived()
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
