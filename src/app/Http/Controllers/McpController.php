<?php

namespace App\Http\Controllers;

use App\DTO\Mcp\McpRequest;
use App\Services\Mcp\McpServer;
use App\Support\PermissionList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class McpController extends Controller
{
    public function __invoke(Request $request, McpServer $mcpServer): JsonResponse|Response
    {
        abort_unless($this->user()->can(PermissionList::MCP_USE), 403, 'Forbidden.');

        $payload = $request->json()->all();
        $response = $mcpServer->handle(
            McpRequest::fromArray($payload),
            $this->user(),
        );

        if ($response === null)
        {
            return response()->noContent();
        }

        return response()->json($response->toArray());
    }
}
