<?php

declare(strict_types=1);

namespace App\Services\Mcp\Handlers;

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
use App\DTO\Request\UpdateWorkflowGraphRequest;
use App\DTO\Request\UpsertScreenRequest;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Audit\AuditLogger;
use App\Support\PermissionList;
use App\UseCase\Command\CreateWorkflowDraftCommand;
use App\UseCase\Command\PublishWorkflowRevisionCommand;
use App\UseCase\Command\RollbackWorkflowRevisionCommand;
use App\UseCase\Command\UpdateWorkflowGraphCommand;
use App\UseCase\Command\UpsertScreenCommand;
use App\UseCase\Query\McpQueryService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class ToolsCallMethodHandler implements McpMethodHandler
{
    public function __construct(
        private readonly McpQueryService $queries,
        private readonly UpsertScreenCommand $upsertScreen,
        private readonly UpdateWorkflowGraphCommand $updateGraph,
        private readonly CreateWorkflowDraftCommand $createDraft,
        private readonly PublishWorkflowRevisionCommand $publish,
        private readonly RollbackWorkflowRevisionCommand $rollback,
    ) {}

    public function method(): string
    {
        return 'tools/call';
    }

    public function handle(McpParams $params, User $actor): McpMethodResult
    {
        $this->authorizeMcpUsage($actor);

        $call = McpToolCallRequest::fromParams($params);

        $result = match ($call->name)
        {
            'process_atlas.list_projects'            => ['projects' => $this->queries->listProjects($actor)],
            'process_atlas.get_workflow'             => $this->getWorkflow($actor, GetWorkflowArguments::fromParams($call->arguments)),
            'process_atlas.get_screen'               => $this->getScreen($actor, GetScreenArguments::fromParams($call->arguments)),
            'process_atlas.update_screen'            => $this->updateScreen($actor, UpdateScreenArguments::fromParams($call->arguments)),
            'process_atlas.update_graph'             => $this->updateGraph($actor, UpdateGraphArguments::fromParams($call->arguments)),
            'process_atlas.create_workflow_revision' => $this->createWorkflowRevision(
                $actor,
                CreateWorkflowRevisionArguments::fromParams($call->arguments),
            ),
            'process_atlas.publish_revision'  => $this->publishRevision($actor, PublishRevisionArguments::fromParams($call->arguments)),
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

        if ($workflow instanceof Workflow)
        {
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
        if ($arguments->screenId <= 0)
        {
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
        if ($arguments->workflowRevisionId <= 0 || $arguments->nodeId === '')
        {
            throw ValidationException::withMessages([
                'workflow_revision_id' => 'workflow_revision_id is required.',
                'node_id'              => 'node_id is required.',
            ]);
        }

        $revision = $this->queries->revisionWithProject($arguments->workflowRevisionId);

        Gate::forUser($actor)->authorize('updateGraph', $revision);
        abort_if($revision->is_published, 422, 'Cannot modify a published revision.');

        $response = $this->upsertScreen->execute(
            $actor,
            $revision,
            UpsertScreenRequest::fromMcpArray($arguments->toArray()),
        );

        AuditLogger::log($actor, $revision, 'updated', 'Screen updated by MCP', [
            'revision_id' => $revision->id,
        ], source: 'mcp');

        return ['screen' => $response->jsonSerialize()];
    }

    /**
     * @return array<string, mixed>
     */
    private function updateGraph(User $actor, UpdateGraphArguments $arguments): array
    {
        $revision = $this->queries->revisionWithProject($arguments->workflowRevisionId);

        Gate::forUser($actor)->authorize('updateGraph', $revision);
        abort_if($revision->is_published, 422, 'Cannot modify a published revision.');

        if ($arguments->lockRevision !== $revision->lock_version)
        {
            throw ValidationException::withMessages([
                'lock_revision' => 'Revision conflict. Reload the latest draft and retry.',
            ]);
        }

        if (! $arguments->hasGraphJson || ! $arguments->graphJsonIsObject)
        {
            throw ValidationException::withMessages([
                'graph_json' => 'graph_json must be an object.',
            ]);
        }

        $response = $this->updateGraph->execute(
            $actor,
            $revision,
            new UpdateWorkflowGraphRequest($arguments->graphJson, $arguments->lockRevision),
            source: 'mcp',
        );

        return [
            'workflow_revision_id' => $response->workflowRevisionId,
            'lock_revision'        => $response->lockVersion,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function createWorkflowRevision(User $actor, CreateWorkflowRevisionArguments $arguments): array
    {
        $workflow = $this->queries->workflowWithProject($arguments->workflowId);

        Gate::forUser($actor)->authorize('createDraft', $workflow);

        $response = $this->createDraft->execute($actor, $workflow);

        AuditLogger::log($actor, $workflow, 'created', 'Draft revision created by MCP', [
            'workflow_id' => $workflow->id,
        ], source: 'mcp');

        return ['workflow_revision' => $response->jsonSerialize()];
    }

    /**
     * @return array<string, mixed>
     */
    private function publishRevision(User $actor, PublishRevisionArguments $arguments): array
    {
        $revision = $this->queries->revisionWithProject($arguments->workflowRevisionId);

        Gate::forUser($actor)->authorize('publish', $revision);

        $response = $this->publish->execute($actor, $revision);

        AuditLogger::log($actor, $revision, 'published', 'Workflow revision published by MCP', [
            'workflow_id' => $revision->workflow_id,
        ], source: 'mcp');

        return [
            'workflow_id'           => $response->workflowId,
            'published_revision_id' => $response->id,
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
        $response = $this->rollback->execute($actor, $workflow, $target);

        AuditLogger::log($actor, $workflow, 'created', 'Workflow rollback draft revision created by MCP', [
            'workflow_id'        => $workflow->id,
            'source_revision_id' => $target->id,
        ], source: 'mcp');

        return ['workflow_revision' => $response->jsonSerialize()];
    }

    private function authorizeMcpUsage(User $actor): void
    {
        abort_unless($actor->can(PermissionList::MCP_USE), 403, 'Forbidden.');
    }
}
