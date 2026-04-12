<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Mcp\McpServer;
use Illuminate\Console\Command;

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
        $userId = (int) ($this->option('user') ?? env('MCP_USER_ID', 0));

        if ($userId <= 0) {
            $this->error('Provide --user=<id> or MCP_USER_ID environment variable.');

            return self::FAILURE;
        }

        $actor = User::query()->find($userId);

        if (! $actor) {
            $this->error('Actor user not found.');

            return self::FAILURE;
        }

        while (($line = fgets(STDIN)) !== false) {
            $line = trim($line);

            if ($line === '') {
                continue;
            }

            $payload = json_decode($line, true);
            if (! is_array($payload)) {
                $this->output->write(json_encode([
                    'jsonrpc' => '2.0',
                    'id' => null,
                    'error' => ['code' => 400, 'message' => 'Invalid JSON input.'],
                ], JSON_UNESCAPED_SLASHES).PHP_EOL);
                continue;
            }

            $response = $mcpServer->handle($payload, $actor);
            $this->output->write(json_encode($response, JSON_UNESCAPED_SLASHES).PHP_EOL);
        }

        return self::SUCCESS;
    }
}
