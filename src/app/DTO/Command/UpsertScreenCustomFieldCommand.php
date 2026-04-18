<?php

namespace App\DTO\Command;

final readonly class UpsertScreenCustomFieldCommand
{
    public function __construct(
        public string $key,
        public ?string $fieldType,
        public ?string $value,
        public ?int $sortOrder,
        public bool $hasSortOrder,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            key: (string) ($payload['key'] ?? ''),
            fieldType: array_key_exists('field_type', $payload) ? self::nullableString($payload['field_type']) : null,
            value: array_key_exists('value', $payload) ? self::nullableString($payload['value']) : null,
            sortOrder: array_key_exists('sort_order', $payload) && $payload['sort_order'] !== null
                ? (int) $payload['sort_order']
                : null,
            hasSortOrder: array_key_exists('sort_order', $payload) && $payload['sort_order'] !== null,
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
