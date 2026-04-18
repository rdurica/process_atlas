<?php

namespace App\DTO\Command;

final readonly class UpdateWorkflowCommand
{
    public function __construct(
        public ?string $name,
        public bool $hasName,
        public ?string $status,
        public bool $hasStatus,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            name: array_key_exists('name', $payload) ? (string) $payload['name'] : null,
            hasName: array_key_exists('name', $payload),
            status: array_key_exists('status', $payload) ? (string) $payload['status'] : null,
            hasStatus: array_key_exists('status', $payload),
        );
    }

    /**
     * @return array{name?: string|null, status?: string|null}
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->hasName) {
            $data['name'] = $this->name;
        }

        if ($this->hasStatus) {
            $data['status'] = $this->status;
        }

        return $data;
    }
}
