<?php

namespace App\DTO\Command;

final readonly class CreateWorkflowCommand
{
    public function __construct(public string $name)
    {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(name: (string) ($payload['name'] ?? ''));
    }
}
