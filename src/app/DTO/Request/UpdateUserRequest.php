<?php

declare(strict_types=1);

namespace App\DTO\Request;

final readonly class UpdateUserRequest
{
    public function __construct(
        public ?string $name,
        public bool $hasName,
        public ?string $email,
        public bool $hasEmail,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            name: array_key_exists('name', $payload) ? (string) $payload['name'] : null,
            hasName: array_key_exists('name', $payload),
            email: array_key_exists('email', $payload) ? (string) $payload['email'] : null,
            hasEmail: array_key_exists('email', $payload),
        );
    }

    /**
     * @return array<string, string|null>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->hasName)
        {
            $data['name'] = $this->name;
        }

        if ($this->hasEmail)
        {
            $data['email'] = $this->email;
        }

        return $data;
    }
}
