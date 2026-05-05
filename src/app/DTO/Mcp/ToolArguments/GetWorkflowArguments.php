<?php

namespace App\DTO\Mcp\ToolArguments;

use App\DTO\Mcp\McpParams;

final readonly class GetWorkflowArguments
{
    public function __construct(public string $workflowId) {}

    public static function fromParams(McpParams $params): self
    {
        return new self(workflowId: $params->string('workflow_id'));
    }
}
