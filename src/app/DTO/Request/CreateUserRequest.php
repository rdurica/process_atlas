<?php

declare(strict_types=1);

namespace App\DTO\Request;

final readonly class CreateUserRequest
{
    /**
     * @param  list<string>  $roles
     */
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
        public array $roles,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload): self
    {
        /** @var list<string> $roles */
        $roles = array_values(array_map('strval', (array) ($payload['roles'] ?? [])));

        return new self(
            name: (string) ($payload['name'] ?? ''),
            email: (string) ($payload['email'] ?? ''),
            password: (string) ($payload['password'] ?? ''),
            roles: $roles,
        );
    }
}
