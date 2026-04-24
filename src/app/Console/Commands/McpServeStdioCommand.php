<?php

namespace App\Console\Commands;

use App\DTO\Mcp\McpRequest;
use App\DTO\Mcp\McpResponse;
use App\Models\User;
use App\Services\Mcp\McpServer;
use App\Support\PermissionList;
use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;

class McpServeStdioCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mcp:serve-stdio {--user= : User ID used as MCP actor}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run MCP JSON-RPC server over stdio.';

    /**
     * Execute the console command.
     */
    public function handle(McpServer $mcpServer): int
    {
        $actor = $this->resolveActor();

        if (! $actor instanceof User)
        {
            return self::FAILURE;
        }

        if (! $actor->can(PermissionList::MCP_USE))
        {
            $this->error('Actor user is missing mcp.use permission.');

            return self::FAILURE;
        }

        while (($body = $this->readFrameBody()) !== null)
        {
            $payload = json_decode($body, true);
            if (! is_array($payload))
            {
                $this->writeErrorResponse(null, -32700, 'Invalid JSON input.');

                continue;
            }

            $response = $mcpServer->handle(McpRequest::fromArray($payload), $actor);
            if ($response !== null)
            {
                $this->writeFrame($response->toArray());
            }
        }

        return self::SUCCESS;
    }

    private function resolveActor(): ?User
    {
        $token = (string) config('services.mcp.token', '');

        if ($token !== '')
        {
            $accessToken = PersonalAccessToken::findToken($token);

            if ($accessToken && $accessToken->tokenable instanceof User)
            {
                return $accessToken->tokenable;
            }
        }

        $userId = (int) ($this->option('user') ?? config('services.mcp.user_id', 0));

        if ($userId <= 0)
        {
            $this->error('Provide --user=<id>, MCP_USER_ID environment variable, or MCP_TOKEN.');

            return null;
        }

        $actor = User::query()->find($userId);

        if (! $actor)
        {
            $this->error('Actor user not found.');

            return null;
        }

        return $actor;
    }

    private function readFrameBody(): ?string
    {
        while (true)
        {
            $headers = [];

            while (($line = fgets(STDIN)) !== false)
            {
                $line = rtrim($line, "\r\n");

                if ($line === '')
                {
                    break;
                }

                [$name, $value] = array_pad(explode(':', $line, 2), 2, '');
                $headers[strtolower(trim($name))] = trim($value);
            }

            if ($line === false)
            {
                return null;
            }

            if ($headers === [])
            {
                continue;
            }

            $contentLength = isset($headers['content-length']) ? (int) $headers['content-length'] : 0;
            if ($contentLength <= 0)
            {
                $this->writeErrorResponse(null, -32700, 'Invalid Content-Length header.');

                continue;
            }

            $body = '';
            while (strlen($body) < $contentLength)
            {
                $chunk = fread(STDIN, $contentLength - strlen($body));

                if ($chunk === false || $chunk === '')
                {
                    return null;
                }

                $body .= $chunk;
            }

            return $body;
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function writeFrame(array $payload): void
    {
        $json = json_encode($payload, JSON_UNESCAPED_SLASHES);
        if ($json === false)
        {
            return;
        }

        fwrite(STDOUT, 'Content-Length: ' . strlen($json) . "\r\n\r\n" . $json);
    }

    private function writeErrorResponse(mixed $id, int $code, string $message): void
    {
        $this->writeFrame(McpResponse::error($id, $code, $message)->toArray());
    }
}
