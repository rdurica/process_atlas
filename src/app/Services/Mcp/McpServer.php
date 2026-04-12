<?php

namespace App\Services\Mcp;

use App\Models\Screen;
use App\Models\Project;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Services\Audit\AuditLogger;
use App\Services\Workflow\WorkflowVersionManager;
use App\Support\PermissionList;
use Illuminate\Validation\ValidationException;

final class McpServer
{
    public function __construct(private readonly WorkflowVersionManager $versionManager)
    {
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function handle(array $payload, User $actor): array
    {
        $method = (string) ($payload['method'] ?? '');
        $id = $payload['id'] ?? null;
        $params = is_array($payload['params'] ?? null) ? $payload['params'] : [];

        try {
            $result = match ($method) {
                'list_projects' => $this->listProjects($actor),
                'get_workflow' => $this->getWorkflow($actor, $params),
                'get_screen' => $this->getScreen($actor, $params),
                'update_screen' => $this->updateScreen($actor, $params),
                'update_graph' => $this->updateGraph($actor, $params),
                'create_workflow_version' => $this->createWorkflowVersion($actor, $params),
                'publish_version' => $this->publishVersion($actor, $params),
                'rollback_version' => $this->rollbackVersion($actor, $params),
                default => throw ValidationException::withMessages(['method' => 'Unknown MCP method.']),
            };

            return [
                'jsonrpc' => '2.0',
                'id' => $id,
                'result' => $result,
            ];
        } catch (\Throwable $exception) {
            return [
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => [
                    'code' => 400,
                    'message' => $exception->getMessage(),
                ],
            ];
        }
    }

    /**
     * @return array{projects: array<int, array{id: int, name: string, description: ?string}>}
     */
    private function listProjects(User $actor): array
    {
        $this->authorize($actor, PermissionList::PROJECTS_VIEW);

        return [
            'projects' => Project::query()
                ->select(['id', 'name', 'description'])
                ->orderBy('id')
                ->get()
                ->map(fn ($project): array => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description,
                ])
                ->all(),
        ];
    }

    /**
     * @param array<string, mixed> $params
     * @return array<string, mixed>
     */
    private function getWorkflow(User $actor, array $params): array
    {
        $this->authorize($actor, PermissionList::WORKFLOWS_VIEW);

        $workflowId = (int) ($params['workflow_id'] ?? 0);
        $workflow = Workflow::query()
            ->with(['latestVersion.screens.customFields'])
            ->findOrFail($workflowId);

        return [
            'workflow' => $workflow->toArray(),
        ];
    }

    /**
     * @param array<string, mixed> $params
     * @return array<string, mixed>
     */
    private function getScreen(User $actor, array $params): array
    {
        $this->authorize($actor, PermissionList::WORKFLOWS_VIEW);

        $screenId = (int) ($params['screen_id'] ?? 0);

        $screen = Screen::query()
            ->with(['customFields'])
            ->findOrFail($screenId);

        return [
            'screen' => $screen->toArray(),
        ];
    }

    /**
     * @param array<string, mixed> $params
     * @return array<string, mixed>
     */
    private function updateScreen(User $actor, array $params): array
    {
        $this->authorize($actor, PermissionList::WORKFLOWS_EDIT);

        $workflowVersionId = (int) ($params['workflow_version_id'] ?? 0);
        $nodeId = (string) ($params['node_id'] ?? '');

        if ($workflowVersionId <= 0 || $nodeId === '') {
            throw ValidationException::withMessages([
                'workflow_version_id' => 'workflow_version_id is required.',
                'node_id' => 'node_id is required.',
            ]);
        }

        $screen = Screen::query()->firstOrCreate(
            [
                'workflow_version_id' => $workflowVersionId,
                'node_id' => $nodeId,
            ],
            [
                'created_by' => $actor->id,
            ]
        );

        $screen->update([
            'title' => array_key_exists('title', $params)
                ? $params['title']
                : $screen->title,
            'subtitle' => array_key_exists('subtitle', $params)
                ? $params['subtitle']
                : $screen->subtitle,
            'description' => array_key_exists('description', $params)
                ? $params['description']
                : $screen->description,
            'updated_by' => $actor->id,
        ]);

        AuditLogger::log($actor, $screen, 'updated', 'Screen updated by MCP', [
            'screen_id' => $screen->id,
        ], source: 'mcp');

        return ['screen' => $screen->fresh(['customFields'])->toArray()];
    }

    /**
     * @param array<string, mixed> $params
     * @return array<string, mixed>
     */
    private function updateGraph(User $actor, array $params): array
    {
        $this->authorize($actor, PermissionList::WORKFLOWS_EDIT);

        $versionId = (int) ($params['workflow_version_id'] ?? 0);
        $version = WorkflowVersion::query()->findOrFail($versionId);

        $incomingLock = (int) ($params['lock_version'] ?? -1);
        if ($incomingLock !== $version->lock_version) {
            throw ValidationException::withMessages([
                'lock_version' => 'Version conflict. Reload the latest draft and retry.',
            ]);
        }

        $version->update([
            'graph_json' => $params['graph_json'] ?? $version->graph_json,
            'lock_version' => $version->lock_version + 1,
        ]);

        AuditLogger::log($actor, $version, 'updated', 'Workflow graph updated by MCP', [
            'workflow_id' => $version->workflow_id,
        ], source: 'mcp');

        return [
            'workflow_version_id' => $version->id,
            'lock_version' => $version->lock_version,
        ];
    }

    /**
     * @param array<string, mixed> $params
     * @return array<string, mixed>
     */
    private function createWorkflowVersion(User $actor, array $params): array
    {
        $this->authorize($actor, PermissionList::WORKFLOWS_EDIT);

        $workflowId = (int) ($params['workflow_id'] ?? 0);
        $workflow = Workflow::query()->findOrFail($workflowId);

        $version = $this->versionManager->createDraftFromLatest($workflow, $actor);

        AuditLogger::log($actor, $version, 'created', 'Draft version created by MCP', [
            'workflow_id' => $workflow->id,
        ], source: 'mcp');

        return ['workflow_version' => $version->toArray()];
    }

    /**
     * @param array<string, mixed> $params
     * @return array<string, mixed>
     */
    private function publishVersion(User $actor, array $params): array
    {
        $this->authorize($actor, PermissionList::WORKFLOWS_PUBLISH);

        $versionId = (int) ($params['workflow_version_id'] ?? 0);
        $version = WorkflowVersion::query()->with('workflow')->findOrFail($versionId);

        $this->versionManager->publishVersion($version);

        AuditLogger::log($actor, $version, 'published', 'Workflow version published by MCP', [
            'workflow_id' => $version->workflow_id,
        ], source: 'mcp');

        return [
            'workflow_id' => $version->workflow_id,
            'published_version_id' => $version->id,
        ];
    }

    /**
     * @param array<string, mixed> $params
     * @return array<string, mixed>
     */
    private function rollbackVersion(User $actor, array $params): array
    {
        $this->authorize($actor, PermissionList::WORKFLOWS_PUBLISH);

        $workflow = Workflow::query()->findOrFail((int) ($params['workflow_id'] ?? 0));
        $target = WorkflowVersion::query()->findOrFail((int) ($params['to_version_id'] ?? 0));

        $newVersion = $this->versionManager->rollbackToVersion($workflow, $target, $actor);

        AuditLogger::log($actor, $newVersion, 'created', 'Workflow rollback draft created by MCP', [
            'workflow_id' => $workflow->id,
            'source_version_id' => $target->id,
        ], source: 'mcp');

        return ['workflow_version' => $newVersion->toArray()];
    }

    private function authorize(User $actor, string $permission): void
    {
        abort_unless($actor->can($permission), 403, 'Forbidden.');
    }
}
