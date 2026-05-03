<?php

namespace App\DTO\Request;

final readonly class CreateProjectRequest
{
    public function __construct(
        public string $name,
        public ?string $description,
        public bool $isPublic = false,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            name: (string) ($payload['name'] ?? ''),
            description: array_key_exists('description', $payload) && $payload['description'] !== null
                ? (string) $payload['description']
                : null,
            isPublic: (bool) ($payload['is_public'] ?? false),
        );
    }
}
