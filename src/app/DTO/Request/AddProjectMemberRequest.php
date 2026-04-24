<?php

namespace App\DTO\Request;

final readonly class AddProjectMemberRequest
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
