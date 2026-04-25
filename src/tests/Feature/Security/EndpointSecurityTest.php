<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void
{
    $this->seed();
});

it('forbids unverified users from accessing api routes', function (): void
{
    $user = User::factory()->unverified()->create();
    $user->assignRole('editor');

    $token = $user->createToken('api-test')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/projects')
        ->assertForbidden();
});

it('forbids unverified users from accessing mcp route', function (): void
{
    $user = User::factory()->unverified()->create();
    $user->assignRole('editor');

    $token = $user->createToken('mcp-test', ['mcp:use'])->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/mcp', [
            'jsonrpc' => '2.0',
            'id'      => 1,
            'method'  => 'initialize',
            'params'  => [],
        ])
        ->assertForbidden();
});
