<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

it('allows process owner to archive and unarchive a workflow', function (): void {
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Archive Test Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Archive Test Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $this->postJson("/api/v1/workflows/{$workflowId}/archive")
        ->assertOk()
        ->assertJsonPath('data.archived_at', fn (string $value) => strlen($value) > 0);

    $this->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk()
        ->assertJsonPath('data.archived_at', fn (?string $value) => $value !== null);

    $listResponse = $this->getJson("/api/v1/projects/{$projectId}/workflows")
        ->assertOk();
    expect(collect($listResponse->json('data'))->pluck('id')->toArray())
        ->not->toContain($workflowId);

    $this->postJson("/api/v1/workflows/{$workflowId}/unarchive")
        ->assertOk()
        ->assertJsonPath('data.archived_at', null);

    $listResponseAfter = $this->getJson("/api/v1/projects/{$projectId}/workflows")
        ->assertOk();
    expect(collect($listResponseAfter->json('data'))->pluck('id')->toArray())
        ->toContain($workflowId);
});

it('allows listing archived workflows with include_archived flag', function (): void {
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Include Archived Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Archived Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $this->postJson("/api/v1/workflows/{$workflowId}/archive")->assertOk();

    $defaultList = $this->getJson("/api/v1/projects/{$projectId}/workflows")
        ->assertOk();
    expect(collect($defaultList->json('data'))->pluck('id')->toArray())
        ->not->toContain($workflowId);

    $fullList = $this->getJson("/api/v1/projects/{$projectId}/workflows?include_archived=1")
        ->assertOk();
    expect(collect($fullList->json('data'))->pluck('id')->toArray())
        ->toContain($workflowId);
});

it('denies archive action for editor role', function (): void {
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $editor = User::factory()->create(['email' => 'editor-role@example.com']);
    $editor->assignRole('editor');

    $this->actingAs($owner);
    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Editor Archive Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $this->postJson("/api/v1/projects/{$projectId}/members", [
        'email' => $editor->email,
        'role' => 'editor',
    ])->assertCreated();

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Editor Archive Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $this->actingAs($editor);
    $this->postJson("/api/v1/workflows/{$workflowId}/archive")
        ->assertForbidden();
});

it('denies archive action for viewer role', function (): void {
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();

    $this->actingAs($owner);
    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Viewer Archive Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $this->postJson("/api/v1/projects/{$projectId}/members", [
        'email' => $viewer->email,
        'role' => 'viewer',
    ])->assertCreated();

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Viewer Archive Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $this->actingAs($viewer);
    $this->postJson("/api/v1/workflows/{$workflowId}/archive")
        ->assertForbidden();
});

it('excludes archived workflows from project workflows_count', function (): void {
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Count Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Count Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $this->get(route('projects.show', $projectId))
        ->assertInertia(fn ($page) => $page
            ->component('ProjectWorkflows')
            ->where('project.workflows_count', 1)
            ->has('workflows', 1)
        );

    $this->postJson("/api/v1/workflows/{$workflowId}/archive")->assertOk();

    $this->get(route('projects.show', $projectId))
        ->assertInertia(fn ($page) => $page
            ->component('ProjectWorkflows')
            ->where('project.workflows_count', 0)
            ->has('workflows', 0)
        );
});
