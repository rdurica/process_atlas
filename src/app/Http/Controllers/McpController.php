<?php

namespace App\Http\Controllers;

use App\Services\Mcp\McpServer;
use App\Support\PermissionList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class McpController extends Controller
{
    public function __invoke(Request $request, McpServer $mcpServer): JsonResponse
    {
        abort_unless($request->user()->can(PermissionList::MCP_USE), 403, 'Forbidden.');

        $payload = $request->json()->all();
        $response = $mcpServer->handle(is_array($payload) ? $payload : [], $request->user());

        return response()->json($response);
    }
}
