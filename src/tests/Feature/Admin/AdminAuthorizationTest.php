<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void
{
    $this->seed();
});

// ─────────────────────────────────────────────────────────────────
// Admin web page access
// ─────────────────────────────────────────────────────────────────

it('allows admin to access admin users page', function (): void
{
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

    $this->actingAs($admin)
        ->get(route('admin.users'))
        ->assertOk();
});

it('forbids non-admin from accessing admin users page', function (): void
{
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();

    $this->actingAs($viewer)
        ->get(route('admin.users'))
        ->assertForbidden();
});

// ─────────────────────────────────────────────────────────────────
// Admin API endpoints
// ─────────────────────────────────────────────────────────────────

it('allows admin to list users via api', function (): void
{
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/users')
        ->assertOk();
});

it('forbids non-admin from listing users via api', function (): void
{
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();

    $this->actingAs($viewer)
        ->getJson('/api/v1/admin/users')
        ->assertForbidden();
});

it('forbids non-admin from creating users via api', function (): void
{
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();

    $this->actingAs($viewer)
        ->postJson('/api/v1/admin/users', [
            'name'     => 'Test User',
            'email'    => 'test@example.com',
            'password' => 'password123',
        ])
        ->assertForbidden();
});

it('forbids non-admin from updating user roles via api', function (): void
{
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();
    $target = User::query()->where('email', 'owner@example.com')->firstOrFail();

    $this->actingAs($viewer)
        ->patchJson("/api/v1/admin/users/{$target->id}/roles", [
            'roles' => ['editor'],
        ])
        ->assertForbidden();
});

it('forbids non-admin from toggling user active status via api', function (): void
{
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();
    $target = User::query()->where('email', 'owner@example.com')->firstOrFail();

    $this->actingAs($viewer)
        ->patchJson("/api/v1/admin/users/{$target->id}/active")
        ->assertForbidden();
});

it('forbids non-admin from deleting users via api', function (): void
{
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();
    $target = User::factory()->create();

    $this->actingAs($viewer)
        ->deleteJson("/api/v1/admin/users/{$target->id}")
        ->assertForbidden();
});

// ─────────────────────────────────────────────────────────────────
// Deactivated user access
// ─────────────────────────────────────────────────────────────────

it('forbids deactivated user from accessing authenticated web routes', function (): void
{
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();
    $viewer->update(['is_active' => false]);

    $this->actingAs($viewer)
        ->get(route('dashboard'))
        ->assertForbidden();
});

it('forbids deactivated user from accessing authenticated api routes', function (): void
{
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();
    $viewer->update(['is_active' => false]);

    $this->actingAs($viewer)
        ->getJson('/api/v1/projects')
        ->assertForbidden();
});

it('revokes api tokens when user is deactivated', function (): void
{
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $target = User::factory()->create(['is_active' => true]);

    $targetToken = $target->createToken('test-token')->plainTextToken;
    $adminToken = $admin->createToken('admin-token')->plainTextToken;

    // Token works before deactivation
    $this->withHeader('Authorization', "Bearer {$targetToken}")
        ->getJson('/api/v1/projects')
        ->assertOk();

    // Clear auth state between requests (Laravel test client persists auth)
    $this->app['auth']->forgetGuards();

    // Deactivate the user via admin token
    $this->withHeader('Authorization', "Bearer {$adminToken}")
        ->patchJson("/api/v1/admin/users/{$target->id}/active")
        ->assertOk();

    // Clear auth state between requests
    $this->app['auth']->forgetGuards();

    // Token no longer works
    $this->withHeader('Authorization', "Bearer {$targetToken}")
        ->getJson('/api/v1/projects')
        ->assertUnauthorized();
});

// ─────────────────────────────────────────────────────────────────
// Project view authorization (web)
// ─────────────────────────────────────────────────────────────────

it('allows project member to view project via web route', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();

    $projectResponse = $this->actingAs($owner)
        ->postJson('/api/v1/projects', [
            'name'        => 'Member Project',
            'description' => 'Test',
        ])
        ->assertCreated();

    $projectId = $projectResponse->json('data.id');

    $this->actingAs($owner)
        ->get(route('projects.show', ['project' => $projectId]))
        ->assertOk();
});

it('forbids non-member from viewing project via web route', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();

    $projectResponse = $this->actingAs($owner)
        ->postJson('/api/v1/projects', [
            'name'        => 'Private Project',
            'description' => 'Test',
        ])
        ->assertCreated();

    $projectId = $projectResponse->json('data.id');

    $this->actingAs($viewer)
        ->get(route('projects.show', ['project' => $projectId]))
        ->assertForbidden();
});

it('allows admin to view any project via web route', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

    $projectResponse = $this->actingAs($owner)
        ->postJson('/api/v1/projects', [
            'name'        => 'Admin View Project',
            'description' => 'Test',
        ])
        ->assertCreated();

    $projectId = $projectResponse->json('data.id');

    $this->actingAs($admin)
        ->get(route('projects.show', ['project' => $projectId]))
        ->assertOk();
});
