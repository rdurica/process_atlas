<?php

namespace App\DTO\Request;

final readonly class UpdateProjectRequest
{
    public function __construct(
        public ?string $name,
        public bool $hasName,
        public ?string $description,
        public bool $hasDescription,
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

        if ($this->hasDescription)
        {
            $data['description'] = $this->description;
        }

        return $data;
    }
}
