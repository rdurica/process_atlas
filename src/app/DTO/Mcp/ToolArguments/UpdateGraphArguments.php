<?php

namespace App\DTO\Mcp\ToolArguments;

use App\DTO\Mcp\McpParams;

final readonly class UpdateGraphArguments
{
    /**
     * @param array<string, mixed> $graphJson
     */
    public function __construct(
        public int $workflowRevisionId,
        public int $lockRevision,
        public array $graphJson,
        public bool $hasGraphJson,
        public bool $graphJsonIsObject,
    ) {
    }

    public static function fromParams(McpParams $params): self
    {
        $raw = $params->all()['graph_json'] ?? null;

        return new self(
            workflowRevisionId: $params->int('workflow_revision_id'),
            lockRevision: $params->int('lock_revision', -1),
            graphJson: is_array($raw) ? $raw : [],
            hasGraphJson: $params->has('graph_json'),
            graphJsonIsObject: is_array($raw),
        );
    }
}
