<?php

namespace App\DTO\Mcp;

final readonly class McpToolCallRequest
{
    public function __construct(
        public string $name,
        public McpParams $arguments,
    ) {
    }

    public static function fromParams(McpParams $params): self
    {
        return new self(
            name: $params->string('name'),
            arguments: McpParams::fromArray($params->object('arguments')),
        );
    }
}
