<?php

namespace App\DTO\Mcp;

final readonly class McpMethodResult
{
    /**
     * @param array<string, mixed> $payload
     */
    public function __construct(private array $payload)
    {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self($payload);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return $this->payload;
    }
}
