<?php

namespace App\Services\Mcp\Handlers;

use App\DTO\Mcp\McpMethodResult;
use App\DTO\Mcp\McpParams;
use App\DTO\Mcp\McpToolDefinition;
use App\Models\User;
use App\Services\Mcp\McpToolCatalog;

final class ToolsListMethodHandler implements McpMethodHandler
{
    public function method(): string
    {
        return 'tools/list';
    }

    public function handle(McpParams $params, User $actor): McpMethodResult
    {
        $tools = array_map(
            static fn (McpToolDefinition $definition): array => $definition->toArray(),
            McpToolCatalog::definitions(),
        );

        return McpMethodResult::fromArray(['tools' => $tools]);
    }
}
