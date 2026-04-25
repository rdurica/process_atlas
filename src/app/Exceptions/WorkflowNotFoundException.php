<?php

declare(strict_types=1);

namespace App\Exceptions;

final class WorkflowNotFoundException extends NotFoundException
{
    public function __construct(string $message = 'Workflow not found.')
    {
        parent::__construct($message);
    }
}
