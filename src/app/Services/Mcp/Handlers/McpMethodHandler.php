<?php

namespace App\Services\Mcp\Handlers;

use App\DTO\Mcp\McpMethodResult;
use App\DTO\Mcp\McpParams;
use App\Models\User;

interface McpMethodHandler
{
    public function method(): string;

    public function handle(McpParams $params, User $actor): McpMethodResult;
}
