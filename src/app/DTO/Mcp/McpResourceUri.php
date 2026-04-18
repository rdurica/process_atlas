<?php

namespace App\DTO\Mcp;

use Illuminate\Validation\ValidationException;

final readonly class McpResourceUri
{
    public function __construct(
        public string $kind,
        public ?int $id,
    ) {
    }

    public static function parse(string $uri): self
    {
        $prefix = 'process-atlas://';
        if (! str_starts_with($uri, $prefix)) {
            throw ValidationException::withMessages(['uri' => 'Unsupported MCP resource URI.']);
        }

        $resource = ltrim(substr($uri, strlen($prefix)), '/');
        if ($resource === '') {
            throw ValidationException::withMessages(['uri' => 'Resource path is required.']);
        }

        $segments = explode('/', $resource);
        if (count($segments) > 2) {
            throw ValidationException::withMessages(['uri' => 'Invalid MCP resource URI format.']);
        }

        $kind = $segments[0];
        $id = $segments[1] ?? null;

        if ($id === null) {
            return new self($kind, null);
        }

        if (! ctype_digit($id) || (int) $id <= 0) {
            throw ValidationException::withMessages(['uri' => 'Resource ID must be a positive integer.']);
        }

        return new self($kind, (int) $id);
    }
}
