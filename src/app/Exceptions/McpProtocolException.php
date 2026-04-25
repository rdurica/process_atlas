<?php

declare(strict_types=1);

namespace App\Exceptions;

final class McpProtocolException extends InfrastructureException
{
    public function __construct(string $message = 'MCP protocol error.')
    {
        parent::__construct($message);
    }
}
