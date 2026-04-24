<?php

namespace App\DTO\Request;

final readonly class UpdateScreenRequest
{
    public function __construct(
        public ?string $title,
        public bool $hasTitle,
        public ?string $subtitle,
        public bool $hasSubtitle,
        public ?string $description,
        public bool $hasDescription,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            title: array_key_exists('title', $payload) ? self::nullableString($payload['title']) : null,
            hasTitle: array_key_exists('title', $payload),
            subtitle: array_key_exists('subtitle', $payload) ? self::nullableString($payload['subtitle']) : null,
            hasSubtitle: array_key_exists('subtitle', $payload),
            description: array_key_exists('description', $payload) ? self::nullableString($payload['description']) : null,
            hasDescription: array_key_exists('description', $payload),
        );
    }

    /**
     * @return array<string, string|null>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->hasTitle)
        {
            $data['title'] = $this->title;
        }

        if ($this->hasSubtitle)
        {
            $data['subtitle'] = $this->subtitle;
        }

        if ($this->hasDescription)
        {
            $data['description'] = $this->description;
        }

        return $data;
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
