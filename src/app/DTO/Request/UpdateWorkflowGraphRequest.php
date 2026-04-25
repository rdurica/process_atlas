<?php

namespace App\DTO\Request;

final readonly class UpdateWorkflowGraphRequest
{
    /**
     * @param  array<string, mixed>  $graphJson
     */
    public function __construct(
        public array $graphJson,
        public int $lockVersion,
        public ?string $source = 'ui',
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            graphJson: is_array($payload['graph_json'] ?? null) ? $payload['graph_json'] : [],
            lockVersion: (int) ($payload['lock_version'] ?? 0),
            source: is_string($payload['source'] ?? null) ? $payload['source'] : 'ui',
        );
    }
}
