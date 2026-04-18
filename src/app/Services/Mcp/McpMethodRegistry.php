<?php

namespace App\Services\Mcp;

use App\DTO\Mcp\McpMethodResult;
use App\DTO\Mcp\McpParams;
use App\Models\User;
use App\Services\Mcp\Handlers\InitializeMethodHandler;
use App\Services\Mcp\Handlers\McpMethodHandler;
use App\Services\Mcp\Handlers\NotificationsInitializedMethodHandler;
use App\Services\Mcp\Handlers\PingMethodHandler;
use App\Services\Mcp\Handlers\ResourcesListMethodHandler;
use App\Services\Mcp\Handlers\ResourcesReadMethodHandler;
use App\Services\Mcp\Handlers\ResourceTemplatesListMethodHandler;
use App\Services\Mcp\Handlers\ToolsCallMethodHandler;
use App\Services\Mcp\Handlers\ToolsListMethodHandler;
use Illuminate\Validation\ValidationException;

final class McpMethodRegistry
{
    /**
     * @var array<string, McpMethodHandler>
     */
    private array $handlers;

    public function __construct(
        InitializeMethodHandler $initialize,
        NotificationsInitializedMethodHandler $notificationsInitialized,
        PingMethodHandler $ping,
        ToolsListMethodHandler $toolsList,
        ToolsCallMethodHandler $toolsCall,
        ResourcesListMethodHandler $resourcesList,
        ResourcesReadMethodHandler $resourcesRead,
        ResourceTemplatesListMethodHandler $resourcesTemplates,
    ) {
        $allHandlers = [
            $initialize,
            $notificationsInitialized,
            $ping,
            $toolsList,
            $toolsCall,
            $resourcesList,
            $resourcesRead,
            $resourcesTemplates,
        ];

        $this->handlers = [];
        foreach ($allHandlers as $handler) {
            $this->handlers[$handler->method()] = $handler;
        }
    }

    public function handle(string $method, McpParams $params, User $actor): McpMethodResult
    {
        $handler = $this->handlers[$method] ?? null;

        if (! $handler) {
            throw ValidationException::withMessages(['method' => 'Unknown MCP method.']);
        }

        return $handler->handle($params, $actor);
    }
}
