<?php

namespace App\DTO\Result;

use App\Models\User;

final readonly class ProjectMemberResult
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public string $role,
    ) {}

    public static function fromUser(User $member, string $role): self
    {
        return new self(
            id: $member->id,
            name: $member->name,
            email: $member->email,
            role: $role,
        );
    }

    /**
     * @return array{id: int, name: string, email: string, role: string}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
        ];
    }
}
