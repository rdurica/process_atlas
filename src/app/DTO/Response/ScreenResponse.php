<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Models\Screen;
use Illuminate\Support\Facades\Storage;
use JsonSerializable;

final readonly class ScreenResponse implements JsonSerializable
{
    public function __construct(
        public string $id,
        public string $nodeId,
        public ?string $title,
        public ?string $subtitle,
        public ?string $note,
        public ?string $imagePath,
        public ?string $drawingJson,
        public ?string $drawingImagePath,
        /** @var array<string, mixed>|null */
        public ?array $customFields,
    ) {}

    private static function url(?string $path): ?string
    {
        if ($path === null)
        {
            return null;
        }

        return Storage::disk('public')->url($path);
    }

    public static function fromModel(Screen $screen): self
    {
        return new self(
            id: $screen->uuid,
            nodeId: $screen->node_id,
            title: $screen->title,
            subtitle: $screen->subtitle,
            note: $screen->note,
            imagePath: $screen->image_path,
            drawingJson: $screen->drawing_json,
            drawingImagePath: $screen->drawing_image_path,
            customFields: $screen->relationLoaded('customFields')
                ? array_map(
                    static fn (array $field): array => [
                        'id'         => $field['uuid'] ?? $field['id'] ?? null,
                        'key'        => $field['key'],
                        'field_type' => $field['field_type'],
                        'value'      => $field['value'],
                        'sort_order' => $field['sort_order'],
                    ],
                    $screen->customFields->toArray(),
                )
                : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'                 => $this->id,
            'node_id'            => $this->nodeId,
            'title'              => $this->title,
            'subtitle'           => $this->subtitle,
            'note'               => $this->note,
            'image_path'         => $this->imagePath,
            'image_url'          => self::url($this->imagePath),
            'drawing_json'       => $this->drawingJson,
            'drawing_image_path' => $this->drawingImagePath,
            'drawing_image_url'  => self::url($this->drawingImagePath),
            'custom_fields'      => $this->customFields,
        ];
    }
}
