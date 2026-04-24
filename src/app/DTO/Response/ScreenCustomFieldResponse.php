<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Models\ScreenCustomField;
use JsonSerializable;

final readonly class ScreenCustomFieldResponse implements JsonSerializable
{
    public function __construct(
        public int $id,
        public string $key,
        public string $fieldType,
        public ?string $value,
        public int $sortOrder,
    ) {}

    public static function fromModel(ScreenCustomField $field): self
    {
        return new self(
            id: $field->id,
            key: $field->key,
            fieldType: $field->field_type,
            value: $field->value,
            sortOrder: $field->sort_order,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'         => $this->id,
            'key'        => $this->key,
            'field_type' => $this->fieldType,
            'value'      => $this->value,
            'sort_order' => $this->sortOrder,
        ];
    }
}
