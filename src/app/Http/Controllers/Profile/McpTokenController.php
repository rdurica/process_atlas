<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Support\PermissionList;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class McpTokenController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $this->user();

        abort_unless($user->can(PermissionList::MCP_USE), 403);

        $user->tokens()->where('name', 'mcp')->delete();

        $token = $user->createToken('mcp', ['mcp:use']);

        return Redirect::route('profile.edit')->with([
            'mcp_token' => $token->plainTextToken,
            'status'    => 'MCP token generated successfully.',
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $user = $this->user();

        abort_unless($user->can(PermissionList::MCP_USE), 403);

        $user->tokens()->where('name', 'mcp')->delete();

        return Redirect::route('profile.edit')->with('status', 'MCP token deleted successfully.');
    }
}
