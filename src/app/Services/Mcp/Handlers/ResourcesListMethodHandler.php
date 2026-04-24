<?php

namespace App\Services\Mcp\Handlers;

use App\DTO\Mcp\McpMethodResult;
use App\DTO\Mcp\McpParams;
use App\DTO\Mcp\McpResourceDefinition;
use App\Models\User;
use App\Services\Mcp\McpResourceCatalog;
use App\Support\PermissionList;
use App\UseCase\Query\McpQueryService;

final class ResourcesListMethodHandler implements McpMethodHandler
{
    public function __construct(private readonly McpQueryService $queries) {}

    public function method(): string
    {
        return 'resources/list';
    }

    public function handle(McpParams $params, User $actor): McpMethodResult
    {
        $this->authorizeMcpUsage($actor);

        $projects = $this->queries->projectsForResources($actor);
        $projectIds = array_map(fn ($project) => $project->id, $projects);

        $workflows = $this->queries->workflowsForResources($projectIds);
        $workflowIds = array_map(fn ($workflow) => $workflow->id, $workflows);

        $revisions = $this->queries->revisionsForResources($workflowIds);
        $revisionIds = array_map(fn ($revision) => $revision->id, $revisions);

        $screens = $this->queries->screensForResources($revisionIds);

        $resources = McpResourceCatalog::baseResources();

        foreach ($projects as $project)
        {
            $resources[] = new McpResourceDefinition(
                uri: "process-atlas://projects/{$project->id}",
                name: "Project {$project->id}: {$project->name}",
                description: 'Project details and workflow links.',
                mimeType: 'application/json',
            );
        }

        foreach ($workflows as $workflow)
        {
            $resources[] = new McpResourceDefinition(
                uri: "process-atlas://workflows/{$workflow->id}",
                name: "Workflow {$workflow->id}: {$workflow->name}",
                description: 'Workflow details including revision timeline.',
                mimeType: 'application/json',
            );
        }

        foreach ($revisions as $revision)
        {
            $resources[] = new McpResourceDefinition(
                uri: "process-atlas://revisions/{$revision->id}",
                name: "Revision {$revision->version_number}",
                description: 'Workflow revision with graph and screens.',
                mimeType: 'application/json',
            );
        }

        foreach ($screens as $screen)
        {
            $resources[] = new McpResourceDefinition(
                uri: "process-atlas://screens/{$screen->id}",
                name: "Screen {$screen->id}: " . ($screen->title ?: $screen->node_id),
                description: 'Screen details and custom fields.',
                mimeType: 'application/json',
            );
        }

        $payload = array_map(
            static fn (McpResourceDefinition $resource): array => $resource->toArray(),
            $resources,
        );

        return McpMethodResult::fromArray(['resources' => $payload]);
    }

    private function authorizeMcpUsage(User $actor): void
    {
        abort_unless($actor->can(PermissionList::MCP_USE), 403, 'Forbidden.');
    }
}
