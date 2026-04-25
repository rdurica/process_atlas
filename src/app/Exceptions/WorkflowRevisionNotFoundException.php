<?php

declare(strict_types=1);

namespace App\Exceptions;

final class WorkflowRevisionNotFoundException extends NotFoundException
{
    public function __construct(string $message = 'Workflow revision not found.')
    {
        parent::__construct($message);
    }
}
