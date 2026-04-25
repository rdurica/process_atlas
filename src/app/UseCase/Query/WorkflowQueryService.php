<?php

namespace App\UseCase\Query;

use App\Exceptions\ConsistencyException;
use App\Models\Project;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowRevision;
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
            ->with(['latestRevision', 'publishedRevision'])
            ->orderBy('id');

        if (! $includeArchived)
        {
            $query->notArchived();
        }

        return $query->get();
    }

    /** @return Workflow|array<string, mixed> */
    public function detailForApi(Workflow $workflow): Workflow|array
    {
        if ($workflow->published_revision_id !== null)
        {
            $cached = $this->cache->get($workflow->id);

            if ($cached !== null)
            {
                return $cached;
            }

            $workflow->load([
                'project',
                'latestRevision.screens.customFields',
                'publishedRevision.screens.customFields',
                'revisions' => fn ($query) => $query->orderByDesc('revision_number'),
            ]);

            $this->cache->put($workflow->id, $workflow->toArray());

            return $workflow;
        }

        return $workflow->load([
            'project',
            'latestRevision.screens.customFields',
            'publishedRevision',
            'revisions' => fn ($query) => $query->orderByDesc('revision_number'),
        ]);
    }

    public function detailForEditor(Workflow $workflow): Workflow
    {
        return $workflow->load([
            'project',
            'latestRevision.creator',
            'latestRevision.screens.customFields',
            'revisions' => fn ($query) => $query->with('creator')->orderByDesc('revision_number'),
        ]);
    }

    /**
     * @return Collection<int, Workflow>
     */
    public function projectWorkflowsForEditor(Workflow $workflow): Collection
    {
        $workflow->loadMissing('project');

        $project = $workflow->project;
        if (! $project instanceof Project)
        {
            throw new ConsistencyException('Workflow is missing a project.');
        }

        return $project
            ->workflows()
            ->notArchived()
            ->select(['id', 'name', 'status'])
            ->orderBy('name')
            ->get();
    }

    public function currentUserRoleForWorkflow(User $user, Workflow $workflow): string
    {
        $workflow->loadMissing('project');

        $project = $workflow->project;
        if (! $project instanceof Project)
        {
            throw new ConsistencyException('Workflow is missing a project.');
        }

        return $user->isAdmin()
            ? 'process_owner'
            : (string) $user->projectRoleIn($project);
    }

    public function findRollbackTarget(int $workflowRevisionId): WorkflowRevision
    {
        return WorkflowRevision::query()->findOrFail($workflowRevisionId);
    }
}
