<?php

namespace App\DTO\Request;

final readonly class UpdateProjectRequest
{
    public function __construct(
        public ?string $name,
        public bool $hasName,
        public ?string $description,
        public bool $hasDescription,
        public ?bool $isPublic,
        public bool $hasIsPublic,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            name: array_key_exists('name', $payload) ? (string) $payload['name'] : null,
            hasName: array_key_exists('name', $payload),
            description: array_key_exists('description', $payload) && $payload['description'] !== null
                ? (string) $payload['description']
                : null,
            hasDescription: array_key_exists('description', $payload),
            isPublic: array_key_exists('is_public', $payload) ? (bool) $payload['is_public'] : null,
            hasIsPublic: array_key_exists('is_public', $payload),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->hasName)
        {
            $data['name'] = $this->name;
        }

        if ($this->hasDescription)
        {
            $data['description'] = $this->description;
        }

        if ($this->hasIsPublic)
        {
            $data['is_public'] = $this->isPublic;
        }

        return $data;
    }
}
