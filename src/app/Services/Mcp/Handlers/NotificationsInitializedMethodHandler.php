<?php

namespace App\Services\Mcp\Handlers;

use App\DTO\Mcp\McpMethodResult;
use App\DTO\Mcp\McpParams;
use App\Models\User;

final class NotificationsInitializedMethodHandler implements McpMethodHandler
{
    public function method(): string
    {
        return 'notifications/initialized';
    }

    public function handle(McpParams $params, User $actor): McpMethodResult
    {
        return McpMethodResult::fromArray([]);
    }
}
