<?php

namespace App\DTO\Mcp;

final readonly class McpResourceDefinition
{
    public function __construct(
        public string $uri,
        public string $name,
        public string $description,
        public string $mimeType,
    ) {}

    /**
     * @return array{uri: string, name: string, description: string, mimeType: string}
     */
    public function toArray(): array
    {
        return [
            'uri'         => $this->uri,
            'name'        => $this->name,
            'description' => $this->description,
            'mimeType'    => $this->mimeType,
        ];
    }
}
