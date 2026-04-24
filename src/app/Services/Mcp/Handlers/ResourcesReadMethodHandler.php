<?php

namespace App\Services\Mcp\Handlers;

use App\DTO\Mcp\McpMethodResult;
use App\DTO\Mcp\McpParams;
use App\DTO\Mcp\McpResourceReadResult;
use App\DTO\Mcp\McpResourceUri;
use App\Models\User;
use App\Models\Workflow;
use App\Queries\McpQueryService;
use App\Support\PermissionList;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class ResourcesReadMethodHandler implements McpMethodHandler
{
    public function __construct(private readonly McpQueryService $queries) {}

    public function method(): string
    {
        return 'resources/read';
    }

    public function handle(McpParams $params, User $actor): McpMethodResult
    {
        $this->authorizeMcpUsage($actor);

        $uri = $params->string('uri');
        if ($uri === '') {
            throw ValidationException::withMessages(['uri' => 'uri is required.']);
        }

        $resourceUri = McpResourceUri::parse($uri);

        $payload = match ($resourceUri->kind) {
            'projects' => $resourceUri->id === null
                ? ['projects' => $this->queries->listProjectsResource($actor)]
                : $this->projectPayload($actor, $resourceUri->id),
            'workflows' => $resourceUri->id === null
                ? ['workflows' => $this->queries->listWorkflowsResource($actor)]
                : $this->workflowPayload($actor, $resourceUri->id),
            'revisions' => $resourceUri->id === null
                ? ['revisions' => $this->queries->listRevisionsResource($actor)]
                : $this->revisionPayload($actor, $resourceUri->id),
            'screens' => $resourceUri->id === null
                ? ['screens' => $this->queries->listScreensResource($actor)]
                : $this->screenPayload($actor, $resourceUri->id),
            default => throw ValidationException::withMessages(['uri' => 'Unsupported MCP resource URI.']),
        };

        return McpResourceReadResult::fromPayload($uri, $payload)->toMethodResult();
    }

    /**
     * @return array{project: array<string, mixed>}
     */
    private function projectPayload(User $actor, int $projectId): array
    {
        $project = $this->queries->projectResourceById($projectId);

        Gate::forUser($actor)->authorize('view', $project);

        return ['project' => $project->toArray()];
    }

    /**
     * @return array{workflow: array<string, mixed>}
     */
    private function workflowPayload(User $actor, int $workflowId): array
    {
        $workflow = $this->queries->workflowResourceById($workflowId);

        if ($workflow instanceof Workflow) {
            Gate::forUser($actor)->authorize('view', $workflow);

            return ['workflow' => $workflow->toArray()];
        }

        Gate::forUser($actor)->authorize('view', Workflow::query()->findOrFail($workflowId));

        return ['workflow' => $workflow];
    }

    /**
     * @return array{revision: array<string, mixed>}
     */
    private function revisionPayload(User $actor, int $revisionId): array
    {
        $revision = $this->queries->revisionResourceById($revisionId);

        Gate::forUser($actor)->authorize('view', $revision);

        return ['revision' => $revision->toArray()];
    }

    /**
     * @return array{screen: array<string, mixed>}
     */
    private function screenPayload(User $actor, int $screenId): array
    {
        $screen = $this->queries->screenResourceById($screenId);

        Gate::forUser($actor)->authorize('view', $screen);

        return ['screen' => $screen->toArray()];
    }

    private function authorizeMcpUsage(User $actor): void
    {
        abort_unless($actor->can(PermissionList::MCP_USE), 403, 'Forbidden.');
    }
}
