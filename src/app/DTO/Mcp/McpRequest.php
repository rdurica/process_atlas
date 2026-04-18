<?php

namespace App\DTO\Mcp;

final readonly class McpRequest
{
    public function __construct(
        public string $jsonrpc,
        public mixed $id,
        public bool $hasId,
        public string $method,
        public McpParams $params,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function fromArray(array $payload): self
    {
        $params = is_array($payload['params'] ?? null) ? $payload['params'] : [];

        return new self(
            jsonrpc: (string) ($payload['jsonrpc'] ?? '2.0'),
            id: $payload['id'] ?? null,
            hasId: array_key_exists('id', $payload),
            method: (string) ($payload['method'] ?? ''),
            params: McpParams::fromArray($params),
        );
    }

    public function isNotification(): bool
    {
        return ! $this->hasId;
    }
}
