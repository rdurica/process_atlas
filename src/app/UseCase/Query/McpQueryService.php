<?php

namespace App\UseCase\Query;

use App\Models\Project;
use App\Models\Screen;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowRevision;
use App\Services\Cache\PublishedWorkflowCacheService;
use Illuminate\Database\Eloquent\Builder;

final class McpQueryService
{
    public function __construct(
        private readonly ProjectQueryService $projects,
        private readonly PublishedWorkflowCacheService $cache,
    ) {}

    /**
     * @return array<int, array{id: string, name: string, description: ?string}>
     */
    public function listProjects(User $actor): array
    {
        return $this->projects->accessibleQuery($actor)
            ->select(['uuid', 'name', 'description'])
            ->orderBy('id')
            ->get()
            ->map(fn (Project $project): array => [
                'id'          => $project->uuid,
                'name'        => $project->name,
                'description' => $project->description,
            ])->values()->all();
    }

    /**
     * @return Builder<Project>
     */
    public function accessibleProjectsQuery(User $actor): Builder
    {
        return $this->projects->accessibleQuery($actor);
    }

    /** @return Workflow|array<string, mixed> */
    public function workflowDetails(string $workflowId): Workflow|array
    {
        $workflow = Workflow::query()->where('uuid', $workflowId)->firstOrFail();

        if ($workflow->published_revision_id !== null)
        {
            $cached = $this->cache->get($workflow->uuid);

            if ($cached !== null)
            {
                return $cached;
            }

            $workflow->load([
                'latestRevision.screens.customFields',
                'publishedRevision.screens.customFields',
                'revisions' => fn ($query) => $query->orderByDesc('revision_number'),
            ]);

            $this->cache->put($workflow->uuid, $workflow->toArray());

            return $workflow;
        }

        return $workflow->load([
            'latestRevision.screens.customFields',
            'revisions' => fn ($query) => $query->orderByDesc('revision_number'),
        ]);
    }

    public function screenDetails(string $screenId): Screen
    {
        return Screen::query()
            ->with(['customFields', 'workflowRevision.workflow.project'])
            ->where('uuid', $screenId)
            ->firstOrFail();
    }

    public function revisionWithProject(string $revisionId): WorkflowRevision
    {
        return WorkflowRevision::query()
            ->with('workflow.project')
            ->where('uuid', $revisionId)
            ->firstOrFail();
    }

    public function findRevision(string $revisionId): WorkflowRevision
    {
        return WorkflowRevision::query()->where('uuid', $revisionId)->firstOrFail();
    }

    public function workflowWithProject(string $workflowId): Workflow
    {
        return Workflow::query()->with('project')->where('uuid', $workflowId)->firstOrFail();
    }

    public function projectResourceById(string $projectId): Project
    {
        return Project::query()
            ->with(['workflows.latestRevision', 'workflows.publishedRevision'])
            ->where('uuid', $projectId)
            ->firstOrFail();
    }

    /**
     * @return array<int, Project>
     */
    public function projectsForResources(User $actor): array
    {
        return $this->accessibleProjectsQuery($actor)
            ->select(['id', 'uuid', 'name'])
            ->orderBy('id')
            ->get()
            ->all();
    }

    /**
     * @param  array<int, int>  $projectIds
     * @return array<int, Workflow>
     */
    public function workflowsForResources(array $projectIds): array
    {
        return Workflow::query()
            ->whereIn('project_id', $projectIds)
            ->select(['id', 'uuid', 'name'])
            ->orderBy('id')
            ->get()
            ->all();
    }

    /**
     * @param  array<int, int>  $workflowIds
     * @return array<int, WorkflowRevision>
     */
    public function revisionsForResources(array $workflowIds): array
    {
        return WorkflowRevision::query()
            ->whereIn('workflow_id', $workflowIds)
            ->select(['id', 'uuid', 'revision_number'])
            ->orderBy('id')
            ->get()
            ->all();
    }

    /**
     * @param  array<int, int>  $revisionIds
     * @return array<int, Screen>
     */
    public function screensForResources(array $revisionIds): array
    {
        return Screen::query()
            ->whereIn('workflow_revision_id', $revisionIds)
            ->select(['id', 'uuid', 'title', 'node_id'])
            ->orderBy('id')
            ->get()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listProjectsResource(User $actor): array
    {
        return $this->accessibleProjectsQuery($actor)
            ->withCount('workflows')
            ->orderBy('name')
            ->get()
            ->map(fn (Project $project): array => [
                'id'              => $project->uuid,
                'name'            => $project->name,
                'description'     => $project->description,
                'workflows_count' => $project->workflows_count,
            ])->values()->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listWorkflowsResource(User $actor): array
    {
        return Workflow::query()
            ->with(['project', 'latestRevision', 'publishedRevision'])
            ->when(
                ! $actor->isAdmin(),
                fn (Builder $query) => $query->whereHas('project.members', fn ($q) => $q->where('user_id', $actor->id)),
            )
            ->orderBy('id')
            ->get()
            ->toArray();
    }

    /** @return Workflow|array<string, mixed> */
    public function workflowResourceById(string $workflowId): Workflow|array
    {
        $workflow = Workflow::query()->where('uuid', $workflowId)->firstOrFail();

        if ($workflow->published_revision_id !== null)
        {
            $cached = $this->cache->get($workflow->uuid);

            if ($cached !== null)
            {
                return $cached;
            }

            $workflow->load([
                'project',
                'latestRevision.screens.customFields',
                'publishedRevision.screens.customFields',
                'revisions' => fn ($query) => $query->with('creator')->orderByDesc('revision_number'),
            ]);

            $this->cache->put($workflow->uuid, $workflow->toArray());

            return $workflow;
        }

        return $workflow->load([
            'project',
            'latestRevision.screens.customFields',
            'publishedRevision',
            'revisions' => fn ($query) => $query->with('creator')->orderByDesc('revision_number'),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listRevisionsResource(User $actor): array
    {
        return WorkflowRevision::query()
            ->with(['workflow'])
            ->when(
                ! $actor->isAdmin(),
                fn (Builder $query) => $query->whereHas('workflow.project.members', fn ($q) => $q->where('user_id', $actor->id)),
            )
            ->orderByDesc('revision_number')
            ->get()
            ->toArray();
    }

    public function revisionResourceById(string $revisionId): WorkflowRevision
    {
        return WorkflowRevision::query()
            ->with(['workflow.project', 'screens.customFields', 'creator', 'sourceRevision'])
            ->where('uuid', $revisionId)
            ->firstOrFail();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listScreensResource(User $actor): array
    {
        return Screen::query()
            ->with(['workflowRevision.workflow'])
            ->when(
                ! $actor->isAdmin(),
                fn (Builder $query) => $query->whereHas(
                    'workflowRevision.workflow.project.members',
                    fn ($q) => $q->where('user_id', $actor->id),
                ),
            )
            ->orderBy('id')
            ->get()
            ->toArray();
    }

    public function screenResourceById(string $screenId): Screen
    {
        return Screen::query()
            ->with(['workflowRevision.workflow.project', 'customFields'])
            ->where('uuid', $screenId)
            ->firstOrFail();
    }
}
