<?php

declare(strict_types=1);

namespace App\DTO\Request;

final readonly class UpdateUserRolesRequest
{
    /**
     * @param  list<string>  $roles
     */
    public function __construct(
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
            roles: $roles,
        );
    }
}
