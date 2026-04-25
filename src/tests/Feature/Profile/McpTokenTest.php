<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void
{
    $this->seed();
});

it('allows user with mcp.use permission to generate a token', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();

    $response = $this
        ->actingAs($owner)
        ->post(route('profile.mcp-token.store'));

    $response
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHas('mcp_token')
        ->assertSessionHas('status');

    expect($owner->tokens()->where('name', 'mcp')->exists())->toBeTrue();

    $token = $owner->tokens()->where('name', 'mcp')->first();
    expect($token->abilities)->toContain('mcp:use');
    expect($token->expires_at)->not->toBeNull();
});

it('replaces existing token when generating a new one', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $oldToken = $owner->createToken('mcp', ['mcp:use']);

    $this
        ->actingAs($owner)
        ->post(route('profile.mcp-token.store'));

    expect($owner->tokens()->where('name', 'mcp')->count())->toBe(1);
    expect($owner->tokens()->where('id', $oldToken->accessToken->id)->exists())->toBeFalse();
});

it('allows user to delete their token', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $owner->createToken('mcp', ['mcp:use']);

    $response = $this
        ->actingAs($owner)
        ->delete(route('profile.mcp-token.destroy'));

    $response
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHas('status');

    expect($owner->tokens()->where('name', 'mcp')->exists())->toBeFalse();
});

it('forbids token generation for user without mcp.use permission', function (): void
{
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();

    $this
        ->actingAs($viewer)
        ->post(route('profile.mcp-token.store'))
        ->assertForbidden();
});

it('forbids token deletion for user without mcp.use permission', function (): void
{
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();

    $this
        ->actingAs($viewer)
        ->delete(route('profile.mcp-token.destroy'))
        ->assertForbidden();
});

it('generated token authenticates on the mcp api endpoint', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();

    $this
        ->actingAs($owner)
        ->post(route('profile.mcp-token.store'));

    $plainToken = session('mcp_token');

    $this->flushSession();

    $this->withHeader('Authorization', "Bearer {$plainToken}")
        ->postJson('/api/mcp', [
            'jsonrpc' => '2.0',
            'id'      => 1,
            'method'  => 'initialize',
            'params'  => [
                'protocolVersion' => '2024-11-05',
                'capabilities'    => [],
                'clientInfo'      => [
                    'name'    => 'test-client',
                    'version' => '1.0.0',
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('result.protocolVersion', '2024-11-05');
});

it('rejects expired mcp tokens on the mcp api endpoint', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $plainToken = $owner->createToken('mcp', ['mcp:use'], now()->subMinute())->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$plainToken}")
        ->postJson('/api/mcp', [
            'jsonrpc' => '2.0',
            'id'      => 1,
            'method'  => 'initialize',
            'params'  => [],
        ])
        ->assertUnauthorized();
});
