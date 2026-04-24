<?php

namespace App\DTO\Mcp;

use Illuminate\Validation\ValidationException;

final readonly class McpToolResult
{
    /**
     * @param  array<string, mixed>  $structuredContent
     */
    public function __construct(private array $structuredContent) {}

    /**
     * @param  array<string, mixed>  $structuredContent
     */
    public static function fromStructuredContent(array $structuredContent): self
    {
        return new self($structuredContent);
    }

    public function toMethodResult(): McpMethodResult
    {
        $json = json_encode($this->structuredContent, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        if ($json === false)
        {
            throw ValidationException::withMessages(['tool' => 'Unable to serialize tool output.']);
        }

        return McpMethodResult::fromArray([
            'content' => [[
                'type' => 'text',
                'text' => $json,
            ]],
            'structuredContent' => $this->structuredContent,
        ]);
    }
}
