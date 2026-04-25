<?php

declare(strict_types=1);

namespace App\Exceptions;

final class ScreenNotFoundException extends NotFoundException
{
    public function __construct(string $message = 'Screen not found.')
    {
        parent::__construct($message);
    }
}
