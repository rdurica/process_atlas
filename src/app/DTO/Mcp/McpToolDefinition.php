<?php

namespace App\DTO\Mcp;

final readonly class McpToolDefinition
{
    /**
     * @param  array<string, mixed>  $inputSchema
     */
    public function __construct(
        public string $name,
        public string $description,
        public array $inputSchema,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'name'        => $this->name,
            'description' => $this->description,
            'inputSchema' => $this->inputSchema,
        ];
    }
}
