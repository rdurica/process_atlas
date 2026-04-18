<?php

namespace App\Services\Mcp\Handlers;

use App\DTO\Mcp\McpMethodResult;
use App\DTO\Mcp\McpParams;
use App\Models\User;

final class InitializeMethodHandler implements McpMethodHandler
{
    public function method(): string
    {
        return 'initialize';
    }

    public function handle(McpParams $params, User $actor): McpMethodResult
    {
        $clientCapabilitiesValue = $params->object('capabilities');
        $clientCapabilities = $clientCapabilitiesValue !== []
            ? $clientCapabilitiesValue
            : (object) [];

        return McpMethodResult::fromArray([
            'protocolVersion' => '2024-11-05',
            'capabilities' => [
                'tools' => ['listChanged' => false],
                'resources' => [
                    'subscribe' => false,
                    'listChanged' => false,
                ],
            ],
            'serverInfo' => [
                'name' => 'process-atlas',
                'version' => '1.0.0',
            ],
            'instructions' => 'Use resources for reads and tools for mutations on workflow revisions.',
            'clientCapabilities' => $clientCapabilities,
        ]);
    }
}
