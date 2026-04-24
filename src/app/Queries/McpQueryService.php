<?php

namespace App\Queries;

use App\Models\Project;
use App\Models\Screen;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Services\Cache\PublishedWorkflowCacheService;
use Illuminate\Database\Eloquent\Builder;

final class McpQueryService
{
    public function __construct(
        private readonly ProjectQueryService $projects,
        private readonly PublishedWorkflowCacheService $cache,
    ) {}

    /**
     * @return array<int, array{id: int, name: string, description: ?string}>
     */
    public function listProjects(User $actor): array
    {
        return $this->projects->accessibleQuery($actor)
            ->select(['id', 'name', 'description'])
            ->orderBy('id')
            ->get()
            ->map(fn (Project $project): array => [
                'id' => $project->id,
                'name' => $project->name,
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

    public function workflowDetails(int $workflowId): Workflow|array
    {
        $workflow = Workflow::query()->findOrFail($workflowId);

        if ($workflow->published_version_id !== null) {
            $cached = $this->cache->get($workflow->id);

            if ($cached !== null) {
                return $cached;
            }

            $workflow->load([
                'latestVersion.screens.customFields',
                'publishedVersion.screens.customFields',
                'versions' => fn ($query) => $query->orderByDesc('version_number'),
            ]);

            $this->cache->put($workflow->id, $workflow->toArray());

            return $workflow;
        }

        return $workflow->load([
            'latestVersion.screens.customFields',
            'versions' => fn ($query) => $query->orderByDesc('version_number'),
        ]);
    }

    public function screenDetails(int $screenId): Screen
    {
        return Screen::query()
            ->with(['customFields', 'workflowVersion.workflow.project'])
            ->findOrFail($screenId);
    }

    public function revisionWithProject(int $revisionId): WorkflowVersion
    {
        return WorkflowVersion::query()
            ->with('workflow.project')
            ->findOrFail($revisionId);
    }

    public function findRevision(int $revisionId): WorkflowVersion
    {
        return WorkflowVersion::query()->findOrFail($revisionId);
    }

    public function workflowWithProject(int $workflowId): Workflow
    {
        return Workflow::query()->with('project')->findOrFail($workflowId);
    }

    public function projectResourceById(int $projectId): Project
    {
        return Project::query()
            ->with(['workflows.latestVersion', 'workflows.publishedVersion'])
            ->findOrFail($projectId);
    }

    /**
     * @return array<int, Project>
     */
    public function projectsForResources(User $actor): array
    {
        return $this->accessibleProjectsQuery($actor)
            ->select(['id', 'name'])
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
            ->select(['id', 'name'])
            ->orderBy('id')
            ->get()
            ->all();
    }

    /**
     * @param  array<int, int>  $workflowIds
     * @return array<int, WorkflowVersion>
     */
    public function revisionsForResources(array $workflowIds): array
    {
        return WorkflowVersion::query()
            ->whereIn('workflow_id', $workflowIds)
            ->select(['id', 'version_number'])
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
            ->whereIn('workflow_version_id', $revisionIds)
            ->select(['id', 'title', 'node_id'])
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
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'workflows_count' => $project->workflows_count,
            ])->values()->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listWorkflowsResource(User $actor): array
    {
        return Workflow::query()
            ->with(['project', 'latestVersion', 'publishedVersion'])
            ->when(
                ! $actor->isAdmin(),
                fn (Builder $query) => $query->whereHas('project.members', fn ($q) => $q->where('user_id', $actor->id))
            )
            ->orderBy('id')
            ->get()
            ->toArray();
    }

    public function workflowResourceById(int $workflowId): Workflow|array
    {
        $workflow = Workflow::query()->findOrFail($workflowId);

        if ($workflow->published_version_id !== null) {
            $cached = $this->cache->get($workflow->id);

            if ($cached !== null) {
                return $cached;
            }

            $workflow->load([
                'project',
                'latestVersion.screens.customFields',
                'publishedVersion.screens.customFields',
                'versions' => fn ($query) => $query->with('creator')->orderByDesc('version_number'),
            ]);

            $this->cache->put($workflow->id, $workflow->toArray());

            return $workflow;
        }

        return $workflow->load([
            'project',
            'latestVersion.screens.customFields',
            'publishedVersion',
            'versions' => fn ($query) => $query->with('creator')->orderByDesc('version_number'),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listRevisionsResource(User $actor): array
    {
        return WorkflowVersion::query()
            ->with(['workflow'])
            ->when(
                ! $actor->isAdmin(),
                fn (Builder $query) => $query->whereHas('workflow.project.members', fn ($q) => $q->where('user_id', $actor->id))
            )
            ->orderByDesc('version_number')
            ->get()
            ->toArray();
    }

    public function revisionResourceById(int $revisionId): WorkflowVersion
    {
        return WorkflowVersion::query()
            ->with(['workflow.project', 'screens.customFields', 'creator', 'rollbackSource'])
            ->findOrFail($revisionId);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listScreensResource(User $actor): array
    {
        return Screen::query()
            ->with(['workflowVersion.workflow'])
            ->when(
                ! $actor->isAdmin(),
                fn (Builder $query) => $query->whereHas(
                    'workflowVersion.workflow.project.members',
                    fn ($q) => $q->where('user_id', $actor->id)
                )
            )
            ->orderBy('id')
            ->get()
            ->toArray();
    }

    public function screenResourceById(int $screenId): Screen
    {
        return Screen::query()
            ->with(['workflowVersion.workflow.project', 'customFields'])
            ->findOrFail($screenId);
    }
}
