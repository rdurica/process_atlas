<?php

namespace App\DTO\Request;

final readonly class CreateWorkflowRequest
{
    public function __construct(public string $name) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(name: (string) ($payload['name'] ?? ''));
    }
}
