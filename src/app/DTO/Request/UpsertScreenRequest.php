<?php

namespace App\DTO\Request;

use Illuminate\Http\UploadedFile;

final readonly class UpsertScreenRequest
{
    public function __construct(
        public string $workflowRevisionId,
        public string $nodeId,
        public ?string $title,
        public bool $hasTitle,
        public ?string $subtitle,
        public bool $hasSubtitle,
        public ?string $note,
        public bool $hasNote,
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
            workflowRevisionId: (string) ($payload['workflow_revision_id'] ?? ''),
            nodeId: (string) ($payload['node_id'] ?? ''),
            title: array_key_exists('title', $payload) ? self::nullableString($payload['title']) : null,
            hasTitle: array_key_exists('title', $payload),
            subtitle: array_key_exists('subtitle', $payload) ? self::nullableString($payload['subtitle']) : null,
            hasSubtitle: array_key_exists('subtitle', $payload),
            note: array_key_exists('note', $payload) ? self::nullableString($payload['note']) : null,
            hasNote: array_key_exists('note', $payload),
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
            workflowRevisionId: '',
            nodeId: (string) ($payload['node_id'] ?? ''),
            title: self::nullableString($payload['title'] ?? null),
            hasTitle: true,
            subtitle: self::nullableString($payload['subtitle'] ?? null),
            hasSubtitle: true,
            note: self::nullableString($payload['note'] ?? null),
            hasNote: true,
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
