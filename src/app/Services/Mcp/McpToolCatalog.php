<?php

namespace App\Services\Mcp;

use App\DTO\Mcp\McpToolDefinition;

final class McpToolCatalog
{
    /**
     * @return list<McpToolDefinition>
     */
    public static function definitions(): array
    {
        return [
            new McpToolDefinition(
                name: 'process_atlas.list_projects',
                description: 'List projects visible to the MCP actor.',
                inputSchema: [
                    'type' => 'object',
                    'properties' => (object) [],
                    'additionalProperties' => false,
                ],
            ),
            new McpToolDefinition(
                name: 'process_atlas.get_workflow',
                description: 'Read workflow details including revisions, graph and screens.',
                inputSchema: [
                    'type' => 'object',
                    'properties' => [
                        'workflow_id' => ['type' => 'integer', 'minimum' => 1],
                    ],
                    'required' => ['workflow_id'],
                    'additionalProperties' => false,
                ],
            ),
            new McpToolDefinition(
                name: 'process_atlas.get_screen',
                description: 'Read a screen and its custom fields.',
                inputSchema: [
                    'type' => 'object',
                    'properties' => [
                        'screen_id' => ['type' => 'integer', 'minimum' => 1],
                    ],
                    'required' => ['screen_id'],
                    'additionalProperties' => false,
                ],
            ),
            new McpToolDefinition(
                name: 'process_atlas.update_screen',
                description: 'Create or update a screen inside a draft workflow revision.',
                inputSchema: [
                    'type' => 'object',
                    'properties' => [
                        'workflow_revision_id' => ['type' => 'integer', 'minimum' => 1],
                        'node_id' => ['type' => 'string', 'minLength' => 1],
                        'title' => ['type' => ['string', 'null']],
                        'subtitle' => ['type' => ['string', 'null']],
                        'description' => ['type' => ['string', 'null']],
                    ],
                    'required' => ['workflow_revision_id', 'node_id'],
                    'additionalProperties' => false,
                ],
            ),
            new McpToolDefinition(
                name: 'process_atlas.update_graph',
                description: 'Update graph JSON for a draft workflow revision using optimistic locking.',
                inputSchema: [
                    'type' => 'object',
                    'properties' => [
                        'workflow_revision_id' => ['type' => 'integer', 'minimum' => 1],
                        'lock_revision' => ['type' => 'integer', 'minimum' => 0],
                        'graph_json' => ['type' => 'object'],
                    ],
                    'required' => ['workflow_revision_id', 'lock_revision', 'graph_json'],
                    'additionalProperties' => false,
                ],
            ),
            new McpToolDefinition(
                name: 'process_atlas.create_workflow_revision',
                description: 'Create a new draft workflow revision from the latest revision.',
                inputSchema: [
                    'type' => 'object',
                    'properties' => [
                        'workflow_id' => ['type' => 'integer', 'minimum' => 1],
                    ],
                    'required' => ['workflow_id'],
                    'additionalProperties' => false,
                ],
            ),
            new McpToolDefinition(
                name: 'process_atlas.publish_revision',
                description: 'Publish a workflow revision.',
                inputSchema: [
                    'type' => 'object',
                    'properties' => [
                        'workflow_revision_id' => ['type' => 'integer', 'minimum' => 1],
                    ],
                    'required' => ['workflow_revision_id'],
                    'additionalProperties' => false,
                ],
            ),
            new McpToolDefinition(
                name: 'process_atlas.rollback_revision',
                description: 'Create a new draft revision from a selected historical revision.',
                inputSchema: [
                    'type' => 'object',
                    'properties' => [
                        'workflow_id' => ['type' => 'integer', 'minimum' => 1],
                        'to_revision_id' => ['type' => 'integer', 'minimum' => 1],
                    ],
                    'required' => ['workflow_id', 'to_revision_id'],
                    'additionalProperties' => false,
                ],
            ),
        ];
    }
}
