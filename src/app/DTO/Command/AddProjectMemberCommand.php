<?php

namespace App\DTO\Command;

final readonly class AddProjectMemberCommand
{
    public function __construct(
        public string $email,
        public string $role,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            email: (string) ($payload['email'] ?? ''),
            role: (string) ($payload['role'] ?? ''),
        );
    }
}
