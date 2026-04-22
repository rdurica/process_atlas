<?php

namespace App\DTO\Mcp\ToolArguments;

use App\DTO\Mcp\McpParams;

final readonly class GetScreenArguments
{
    public function __construct(public int $screenId) {}

    public static function fromParams(McpParams $params): self
    {
        return new self(screenId: $params->int('screen_id'));
    }
}
