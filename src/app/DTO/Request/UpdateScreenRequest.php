<?php

namespace App\DTO\Request;

final readonly class UpdateScreenRequest
{
    public function __construct(
        public ?string $title,
        public bool $hasTitle,
        public ?string $subtitle,
        public bool $hasSubtitle,
        public ?string $note,
        public bool $hasNote,
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
            note: array_key_exists('note', $payload) ? self::nullableString($payload['note']) : null,
            hasNote: array_key_exists('note', $payload),
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

        if ($this->hasNote)
        {
            $data['note'] = $this->note;
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
