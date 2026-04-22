<?php

namespace App\DTO\Command;

use Illuminate\Http\UploadedFile;

final readonly class UpsertScreenCommand
{
    public function __construct(
        public int $workflowVersionId,
        public string $nodeId,
        public ?string $title,
        public bool $hasTitle,
        public ?string $subtitle,
        public bool $hasSubtitle,
        public ?string $description,
        public bool $hasDescription,
        public ?UploadedFile $image,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload, ?UploadedFile $image = null): self
    {
        return new self(
            workflowVersionId: (int) ($payload['workflow_version_id'] ?? 0),
            nodeId: (string) ($payload['node_id'] ?? ''),
            title: array_key_exists('title', $payload) ? self::nullableString($payload['title']) : null,
            hasTitle: array_key_exists('title', $payload),
            subtitle: array_key_exists('subtitle', $payload) ? self::nullableString($payload['subtitle']) : null,
            hasSubtitle: array_key_exists('subtitle', $payload),
            description: array_key_exists('description', $payload) ? self::nullableString($payload['description']) : null,
            hasDescription: array_key_exists('description', $payload),
            image: $image,
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromMcpArray(array $payload): self
    {
        return new self(
            workflowVersionId: 0,
            nodeId: (string) ($payload['node_id'] ?? ''),
            title: self::nullableString($payload['title'] ?? null),
            hasTitle: true,
            subtitle: self::nullableString($payload['subtitle'] ?? null),
            hasSubtitle: true,
            description: self::nullableString($payload['description'] ?? null),
            hasDescription: true,
            image: null,
        );
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return (string) $value;
    }
}
