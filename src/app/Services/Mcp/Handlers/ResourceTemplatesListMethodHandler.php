<?php

namespace App\Services\Mcp\Handlers;

use App\DTO\Mcp\McpMethodResult;
use App\DTO\Mcp\McpParams;
use App\DTO\Mcp\McpResourceTemplateDefinition;
use App\Models\User;
use App\Services\Mcp\McpResourceCatalog;

final class ResourceTemplatesListMethodHandler implements McpMethodHandler
{
    public function method(): string
    {
        return 'resources/templates/list';
    }

    public function handle(McpParams $params, User $actor): McpMethodResult
    {
        $resourceTemplates = array_map(
            static fn (McpResourceTemplateDefinition $template): array => $template->toArray(),
            McpResourceCatalog::templates(),
        );

        return McpMethodResult::fromArray(['resourceTemplates' => $resourceTemplates]);
    }
}
