<?php

namespace App\DTO\Mcp\ToolArguments;

use App\DTO\Mcp\McpParams;

final readonly class CreateWorkflowRevisionArguments
{
    public function __construct(public int $workflowId)
    {
    }

    public static function fromParams(McpParams $params): self
    {
        return new self(workflowId: $params->int('workflow_id'));
    }
}
