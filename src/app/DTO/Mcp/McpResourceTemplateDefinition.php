<?php

namespace App\DTO\Mcp;

final readonly class McpResourceTemplateDefinition
{
    public function __construct(
        public string $uriTemplate,
        public string $name,
        public string $description,
        public string $mimeType,
    ) {}

    /**
     * @return array{uriTemplate: string, name: string, description: string, mimeType: string}
     */
    public function toArray(): array
    {
        return [
            'uriTemplate' => $this->uriTemplate,
            'name' => $this->name,
            'description' => $this->description,
            'mimeType' => $this->mimeType,
        ];
    }
}
