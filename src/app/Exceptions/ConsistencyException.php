<?php

declare(strict_types=1);

namespace App\Exceptions;

final class ConsistencyException extends DomainException
{
    public function __construct(string $message = 'Data consistency violation.')
    {
        parent::__construct($message);
    }
}
