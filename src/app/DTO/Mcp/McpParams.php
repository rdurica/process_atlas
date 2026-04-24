<?php

namespace App\DTO\Mcp;

final readonly class McpParams
{
    /**
     * @param  array<string, mixed>  $values
     */
    public function __construct(private array $values) {}

    /**
     * @param  array<string, mixed>  $values
     */
    public static function fromArray(array $values): self
    {
        return new self($values);
    }

    /**
     * @return array<string, mixed>
     */
    public function all(): array
    {
        return $this->values;
    }

    public function has(string $key): bool
    {
        return array_key_exists($key, $this->values);
    }

    public function string(string $key, string $default = ''): string
    {
        if (! $this->has($key))
        {
            return $default;
        }

        $value = $this->values[$key];

        if ($value === null)
        {
            return $default;
        }

        return (string) $value;
    }

    public function nullableString(string $key): ?string
    {
        if (! $this->has($key) || $this->values[$key] === null)
        {
            return null;
        }

        return (string) $this->values[$key];
    }

    public function int(string $key, int $default = 0): int
    {
        if (! $this->has($key) || $this->values[$key] === null)
        {
            return $default;
        }

        return (int) $this->values[$key];
    }

    /**
     * @return array<string, mixed>
     */
    public function object(string $key): array
    {
        $value = $this->values[$key] ?? null;

        return is_array($value) ? $value : [];
    }
}
