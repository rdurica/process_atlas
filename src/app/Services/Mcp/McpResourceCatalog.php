<?php

namespace App\Services\Mcp;

use App\DTO\Mcp\McpResourceDefinition;
use App\DTO\Mcp\McpResourceTemplateDefinition;

final class McpResourceCatalog
{
    /**
     * @return list<McpResourceTemplateDefinition>
     */
    public static function templates(): array
    {
        return [
            new McpResourceTemplateDefinition(
                uriTemplate: 'process-atlas://projects/{project_id}',
                name: 'Project By ID',
                description: 'Read one project including workflows.',
                mimeType: 'application/json',
            ),
            new McpResourceTemplateDefinition(
                uriTemplate: 'process-atlas://workflows/{workflow_id}',
                name: 'Workflow By ID',
                description: 'Read one workflow including revisions and screens.',
                mimeType: 'application/json',
            ),
            new McpResourceTemplateDefinition(
                uriTemplate: 'process-atlas://revisions/{revision_id}',
                name: 'Revision By ID',
                description: 'Read one workflow revision.',
                mimeType: 'application/json',
            ),
            new McpResourceTemplateDefinition(
                uriTemplate: 'process-atlas://screens/{screen_id}',
                name: 'Screen By ID',
                description: 'Read one workflow screen.',
                mimeType: 'application/json',
            ),
        ];
    }

    /**
     * @return list<McpResourceDefinition>
     */
    public static function baseResources(): array
    {
        return [
            new McpResourceDefinition(
                uri: 'process-atlas://projects',
                name: 'Projects',
                description: 'List of projects visible to the MCP actor.',
                mimeType: 'application/json',
            ),
            new McpResourceDefinition(
                uri: 'process-atlas://workflows',
                name: 'Workflows',
                description: 'List of workflows visible to the MCP actor.',
                mimeType: 'application/json',
            ),
            new McpResourceDefinition(
                uri: 'process-atlas://revisions',
                name: 'Revisions',
                description: 'List of workflow revisions visible to the MCP actor.',
                mimeType: 'application/json',
            ),
            new McpResourceDefinition(
                uri: 'process-atlas://screens',
                name: 'Screens',
                description: 'List of workflow screens visible to the MCP actor.',
                mimeType: 'application/json',
            ),
        ];
    }
}
