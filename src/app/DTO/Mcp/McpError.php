<?php

namespace App\DTO\Mcp;

final readonly class McpError
{
    public function __construct(
        public int $code,
        public string $message,
    ) {
    }

    /**
     * @return array{code: int, message: string}
     */
    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'message' => $this->message,
        ];
    }
}
