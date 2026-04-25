<?php

declare(strict_types=1);

namespace App\Exceptions;

final class ImageProcessingException extends InfrastructureException
{
    public function __construct(string $message = 'Image processing failed.')
    {
        parent::__construct($message);
    }
}
