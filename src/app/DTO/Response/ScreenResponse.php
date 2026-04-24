<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Models\Screen;
use JsonSerializable;

final readonly class ScreenResponse implements JsonSerializable
{
    public function __construct(
        public int $id,
        public string $nodeId,
        public ?string $title,
        public ?string $subtitle,
        public ?string $description,
        public ?string $imagePath,
        public ?array $customFields,
    ) {}

    public static function fromModel(Screen $screen): self
    {
        return new self(
            id: $screen->id,
            nodeId: $screen->node_id,
            title: $screen->title,
            subtitle: $screen->subtitle,
            description: $screen->description,
            imagePath: $screen->image_path,
            customFields: $screen->relationLoaded('customFields') ? $screen->customFields->toArray() : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'            => $this->id,
            'node_id'       => $this->nodeId,
            'title'         => $this->title,
            'subtitle'      => $this->subtitle,
            'description'   => $this->description,
            'image_path'    => $this->imagePath,
            'custom_fields' => $this->customFields,
        ];
    }
}
