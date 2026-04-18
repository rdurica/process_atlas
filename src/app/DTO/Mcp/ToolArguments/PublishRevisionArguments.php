<?php

namespace App\DTO\Mcp\ToolArguments;

use App\DTO\Mcp\McpParams;

final readonly class PublishRevisionArguments
{
    public function __construct(public int $workflowRevisionId)
    {
    }

    public static function fromParams(McpParams $params): self
    {
        return new self(workflowRevisionId: $params->int('workflow_revision_id'));
    }
}
