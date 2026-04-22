<?php

namespace App\DTO\Mcp;

use Illuminate\Validation\ValidationException;

final readonly class McpResourceReadResult
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        private string $uri,
        private array $payload,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromPayload(string $uri, array $payload): self
    {
        return new self($uri, $payload);
    }

    public function toMethodResult(): McpMethodResult
    {
        $text = json_encode($this->payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        if ($text === false) {
            throw ValidationException::withMessages(['uri' => 'Unable to serialize MCP resource payload.']);
        }

        return McpMethodResult::fromArray([
            'contents' => [[
                'uri' => $this->uri,
                'mimeType' => 'application/json',
                'text' => $text,
            ]],
        ]);
    }
}
