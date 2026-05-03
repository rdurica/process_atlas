<?php

namespace App\UseCase\Query;

use App\Exceptions\ConsistencyException;
use App\Models\Project;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Cache\PublishedWorkflowCacheService;
use Illuminate\Support\Collection;

final class WorkflowQueryService
{
    public function __construct(private readonly PublishedWorkflowCacheService $cache) {}

    /**
     * @return array<string, mixed>
     */
    public function listForProject(Project $project, bool $includeArchived = false, int $page = 1, int $perPage = 20, ?string $search = null, ?string $status = null): array
    {
        $query = $project
            ->workflows()
            ->with(['latestRevision', 'publishedRevision'])
            ->orderBy('name');

        if (! $includeArchived)
        {
            $query->notArchived();
        }

        if ($search)
        {
            $query->where('name', 'ilike', "%{$search}%");
        }

        if ($status && $status !== 'all')
        {
            $query->where('status', $status);
        }

        $paginator = $query->paginate(perPage: $perPage, page: $page);

        return [
            'data'         => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'total'        => $paginator->total(),
            'from'         => $paginator->firstItem(),
            'to'           => $paginator->lastItem(),
        ];
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
                'revisions' => fn ($query) => $query->orderByRaw('revision_number IS NULL DESC, revision_number DESC, created_at DESC'),
            ]);

            $this->cache->put($workflow->id, $workflow->toArray());

            return $workflow;
        }

        return $workflow->load([
            'project',
            'latestRevision.screens.customFields',
            'publishedRevision',
            'revisions' => fn ($query) => $query->orderByRaw('revision_number IS NULL DESC, revision_number DESC, created_at DESC'),
        ]);
    }

    public function detailForEditor(Workflow $workflow): Workflow
    {
        return $workflow->load([
            'project',
            'latestRevision.creator',
            'latestRevision.screens.customFields',
            'publishedRevision',
            'revisions' => fn ($query) => $query->with('creator')->orderByRaw('revision_number IS NULL DESC, revision_number DESC, created_at DESC'),
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

        if ($user->isAdmin())
        {
            return 'process_owner';
        }

        $role = $user->projectRoleIn($project);

        if ($role === null && $project->isPublic())
        {
            return 'viewer';
        }

        return (string) $role;
    }
}
