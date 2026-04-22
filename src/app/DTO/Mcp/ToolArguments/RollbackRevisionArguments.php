<?php

namespace App\DTO\Mcp\ToolArguments;

use App\DTO\Mcp\McpParams;

final readonly class RollbackRevisionArguments
{
    public function __construct(
        public int $workflowId,
        public int $toRevisionId,
    ) {}

    public static function fromParams(McpParams $params): self
    {
        return new self(
            workflowId: $params->int('workflow_id'),
            toRevisionId: $params->int('to_revision_id'),
        );
    }
}
