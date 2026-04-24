<?php

namespace App\Services\Mcp\Handlers;

use App\Actions\ScreenActionService;
use App\Actions\WorkflowVersionActionService;
use App\DTO\Command\UpdateWorkflowGraphCommand;
use App\DTO\Command\UpsertScreenCommand;
use App\DTO\Mcp\McpMethodResult;
use App\DTO\Mcp\McpParams;
use App\DTO\Mcp\McpToolCallRequest;
use App\DTO\Mcp\McpToolResult;
use App\DTO\Mcp\ToolArguments\CreateWorkflowRevisionArguments;
use App\DTO\Mcp\ToolArguments\GetScreenArguments;
use App\DTO\Mcp\ToolArguments\GetWorkflowArguments;
use App\DTO\Mcp\ToolArguments\PublishRevisionArguments;
use App\DTO\Mcp\ToolArguments\RollbackRevisionArguments;
use App\DTO\Mcp\ToolArguments\UpdateGraphArguments;
use App\DTO\Mcp\ToolArguments\UpdateScreenArguments;
use App\Models\User;
use App\Models\Workflow;
use App\Queries\McpQueryService;
use App\Services\Audit\AuditLogger;
use App\Support\PermissionList;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class ToolsCallMethodHandler implements McpMethodHandler
{
    public function __construct(
        private readonly McpQueryService $queries,
        private readonly ScreenActionService $screenActions,
        private readonly WorkflowVersionActionService $versionActions,
    ) {}

    public function method(): string
    {
        return 'tools/call';
    }

    public function handle(McpParams $params, User $actor): McpMethodResult
    {
        $this->authorizeMcpUsage($actor);

        $call = McpToolCallRequest::fromParams($params);

        $result = match ($call->name) {
            'process_atlas.list_projects' => ['projects' => $this->queries->listProjects($actor)],
            'process_atlas.get_workflow' => $this->getWorkflow($actor, GetWorkflowArguments::fromParams($call->arguments)),
            'process_atlas.get_screen' => $this->getScreen($actor, GetScreenArguments::fromParams($call->arguments)),
            'process_atlas.update_screen' => $this->updateScreen($actor, UpdateScreenArguments::fromParams($call->arguments)),
            'process_atlas.update_graph' => $this->updateGraph($actor, UpdateGraphArguments::fromParams($call->arguments)),
            'process_atlas.create_workflow_revision' => $this->createWorkflowRevision(
                $actor,
                CreateWorkflowRevisionArguments::fromParams($call->arguments),
            ),
            'process_atlas.publish_revision' => $this->publishRevision($actor, PublishRevisionArguments::fromParams($call->arguments)),
            'process_atlas.rollback_revision' => $this->rollbackRevision(
                $actor,
                RollbackRevisionArguments::fromParams($call->arguments),
            ),
            default => throw ValidationException::withMessages(['name' => 'Unknown tool name.']),
        };

        return McpToolResult::fromStructuredContent($result)->toMethodResult();
    }

    /**
     * @return array<string, mixed>
     */
    private function getWorkflow(User $actor, GetWorkflowArguments $arguments): array
    {
        $workflow = $this->queries->workflowDetails($arguments->workflowId);

        if ($workflow instanceof Workflow) {
            Gate::forUser($actor)->authorize('view', $workflow);

            return ['workflow' => $workflow->toArray()];
        }

        Gate::forUser($actor)->authorize('view', Workflow::query()->findOrFail($arguments->workflowId));

        return ['workflow' => $workflow];
    }

    /**
     * @return array<string, mixed>
     */
    private function getScreen(User $actor, GetScreenArguments $arguments): array
    {
        if ($arguments->screenId <= 0) {
            throw ValidationException::withMessages(['screen_id' => 'screen_id is required.']);
        }

        $screen = $this->queries->screenDetails($arguments->screenId);

        Gate::forUser($actor)->authorize('view', $screen);

        return ['screen' => $screen->toArray()];
    }

    /**
     * @return array<string, mixed>
     */
    private function updateScreen(User $actor, UpdateScreenArguments $arguments): array
    {
        if ($arguments->workflowRevisionId <= 0 || $arguments->nodeId === '') {
            throw ValidationException::withMessages([
                'workflow_revision_id' => 'workflow_revision_id is required.',
                'node_id' => 'node_id is required.',
            ]);
        }

        $revision = $this->queries->revisionWithProject($arguments->workflowRevisionId);

        Gate::forUser($actor)->authorize('updateGraph', $revision);
        abort_if($revision->is_published, 422, 'Cannot modify a published revision.');

        $screen = $this->screenActions->upsertForMcp(
            $actor,
            $revision,
            UpsertScreenCommand::fromMcpArray($arguments->toArray()),
        );

        AuditLogger::log($actor, $screen, 'updated', 'Screen updated by MCP', [
            'screen_id' => $screen->id,
        ], source: 'mcp');

        return ['screen' => $screen->toArray()];
    }

    /**
     * @return array<string, mixed>
     */
    private function updateGraph(User $actor, UpdateGraphArguments $arguments): array
    {
        $revision = $this->queries->revisionWithProject($arguments->workflowRevisionId);

        Gate::forUser($actor)->authorize('updateGraph', $revision);
        abort_if($revision->is_published, 422, 'Cannot modify a published revision.');

        if ($arguments->lockRevision !== $revision->lock_version) {
            throw ValidationException::withMessages([
                'lock_revision' => 'Revision conflict. Reload the latest draft and retry.',
            ]);
        }

        if (! $arguments->hasGraphJson || ! $arguments->graphJsonIsObject) {
            throw ValidationException::withMessages([
                'graph_json' => 'graph_json must be an object.',
            ]);
        }

        $result = $this->versionActions->updateGraph(
            $actor,
            $revision,
            new UpdateWorkflowGraphCommand($arguments->graphJson, $arguments->lockRevision),
            source: 'mcp',
        );

        return $result->toMcpArray();
    }

    /**
     * @return array<string, mixed>
     */
    private function createWorkflowRevision(User $actor, CreateWorkflowRevisionArguments $arguments): array
    {
        $workflow = $this->queries->workflowWithProject($arguments->workflowId);

        Gate::forUser($actor)->authorize('createDraft', $workflow);

        $version = $this->versionActions->createDraft($actor, $workflow);

        AuditLogger::log($actor, $version, 'created', 'Draft revision created by MCP', [
            'workflow_id' => $workflow->id,
        ], source: 'mcp');

        return ['workflow_revision' => $version->toArray()];
    }

    /**
     * @return array<string, mixed>
     */
    private function publishRevision(User $actor, PublishRevisionArguments $arguments): array
    {
        $version = $this->queries->revisionWithProject($arguments->workflowRevisionId);

        Gate::forUser($actor)->authorize('publish', $version);

        $published = $this->versionActions->publish($actor, $version);

        AuditLogger::log($actor, $version, 'published', 'Workflow revision published by MCP', [
            'workflow_id' => $version->workflow_id,
        ], source: 'mcp');

        return [
            'workflow_id' => $published->workflow_id,
            'published_revision_id' => $published->id,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rollbackRevision(User $actor, RollbackRevisionArguments $arguments): array
    {
        $workflow = $this->queries->workflowWithProject($arguments->workflowId);

        Gate::forUser($actor)->authorize('rollback', $workflow);

        $target = $this->queries->findRevision($arguments->toRevisionId);
        $version = $this->versionActions->rollback($actor, $workflow, $target);

        AuditLogger::log($actor, $version, 'created', 'Workflow rollback draft revision created by MCP', [
            'workflow_id' => $workflow->id,
            'source_revision_id' => $target->id,
        ], source: 'mcp');

        return ['workflow_revision' => $version->toArray()];
    }

    private function authorizeMcpUsage(User $actor): void
    {
        abort_unless($actor->can(PermissionList::MCP_USE), 403, 'Forbidden.');
    }
}
