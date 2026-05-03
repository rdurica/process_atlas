<?php

namespace App\DTO\Request;

use Illuminate\Http\UploadedFile;

final readonly class UpsertScreenRequest
{
    public function __construct(
        public int $workflowRevisionId,
        public string $nodeId,
        public ?string $title,
        public bool $hasTitle,
        public ?string $subtitle,
        public bool $hasSubtitle,
        public ?string $description,
        public bool $hasDescription,
        public ?UploadedFile $image,
        public ?string $drawingJson,
        public bool $hasDrawingJson,
        public ?UploadedFile $drawingImage,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload, ?UploadedFile $image = null, ?UploadedFile $drawingImage = null): self
    {
        return new self(
            workflowRevisionId: (int) ($payload['workflow_revision_id'] ?? 0),
            nodeId: (string) ($payload['node_id'] ?? ''),
            title: array_key_exists('title', $payload) ? self::nullableString($payload['title']) : null,
            hasTitle: array_key_exists('title', $payload),
            subtitle: array_key_exists('subtitle', $payload) ? self::nullableString($payload['subtitle']) : null,
            hasSubtitle: array_key_exists('subtitle', $payload),
            description: array_key_exists('description', $payload) ? self::nullableString($payload['description']) : null,
            hasDescription: array_key_exists('description', $payload),
            image: $image,
            drawingJson: array_key_exists('drawing_json', $payload) ? self::nullableString($payload['drawing_json']) : null,
            hasDrawingJson: array_key_exists('drawing_json', $payload),
            drawingImage: $drawingImage,
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromMcpArray(array $payload): self
    {
        return new self(
            workflowRevisionId: 0,
            nodeId: (string) ($payload['node_id'] ?? ''),
            title: self::nullableString($payload['title'] ?? null),
            hasTitle: true,
            subtitle: self::nullableString($payload['subtitle'] ?? null),
            hasSubtitle: true,
            description: self::nullableString($payload['description'] ?? null),
            hasDescription: true,
            image: null,
            drawingJson: self::nullableString($payload['drawing_json'] ?? null),
            hasDrawingJson: true,
            drawingImage: null,
        );
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null)
        {
            return null;
        }

        return (string) $value;
    }
}
