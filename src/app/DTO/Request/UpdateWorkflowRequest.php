<?php

namespace App\DTO\Request;

final readonly class UpdateWorkflowRequest
{
    public function __construct(
        public ?string $name,
        public bool $hasName,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            name: array_key_exists('name', $payload) ? (string) $payload['name'] : null,
            hasName: array_key_exists('name', $payload),
        );
    }

    /**
     * @return array{name?: string|null}
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->hasName)
        {
            $data['name'] = $this->name;
        }

        return $data;
    }
}
