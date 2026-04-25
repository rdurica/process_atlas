<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Models\User;
use JsonSerializable;

final readonly class UserResponse implements JsonSerializable
{
    /**
     * @param  list<string>  $roles
     */
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public array $roles,
        public bool $isActive,
        public ?string $createdAt,
    ) {}

    public static function fromModel(User $user): self
    {
        /** @var list<string> $roles */
        $roles = $user->roles->pluck('name')->all();

        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            roles: $roles,
            isActive: $user->is_active,
            createdAt: $user->created_at?->toIso8601String(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'roles'      => $this->roles,
            'is_active'  => $this->isActive,
            'created_at' => $this->createdAt,
        ];
    }
}
