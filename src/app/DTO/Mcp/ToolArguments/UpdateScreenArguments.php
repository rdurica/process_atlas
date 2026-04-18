<?php

namespace App\DTO\Mcp\ToolArguments;

use App\DTO\Mcp\McpParams;

final readonly class UpdateScreenArguments
{
    public function __construct(
        public int $workflowRevisionId,
        public string $nodeId,
        public ?string $title,
        public ?string $subtitle,
        public ?string $description,
    ) {
    }

    public static function fromParams(McpParams $params): self
    {
        return new self(
            workflowRevisionId: $params->int('workflow_revision_id'),
            nodeId: trim($params->string('node_id')),
            title: $params->nullableString('title'),
            subtitle: $params->nullableString('subtitle'),
            description: $params->nullableString('description'),
        );
    }

    /**
     * @return array<string, string|int|null>
     */
    public function toArray(): array
    {
        return [
            'workflow_revision_id' => $this->workflowRevisionId,
            'node_id' => $this->nodeId,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'description' => $this->description,
        ];
    }
}
