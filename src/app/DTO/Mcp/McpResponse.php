<?php

namespace App\DTO\Mcp;

final readonly class McpResponse
{
    private function __construct(
        public mixed $id,
        public ?McpMethodResult $result,
        public ?McpError $error,
    ) {
    }

    public static function success(mixed $id, McpMethodResult $result): self
    {
        return new self($id, $result, null);
    }

    public static function error(mixed $id, int $code, string $message): self
    {
        return new self($id, null, new McpError($code, $message));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $payload = [
            'jsonrpc' => '2.0',
            'id' => $this->id,
        ];

        if ($this->error !== null) {
            $payload['error'] = $this->error->toArray();

            return $payload;
        }

        $payload['result'] = $this->result?->toArray() ?? [];

        return $payload;
    }
}
