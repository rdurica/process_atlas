<?php

namespace App\DTO\Command;

final readonly class UpdateProjectMemberRoleCommand
{
    public function __construct(public string $role)
    {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(role: (string) ($payload['role'] ?? ''));
    }
}
