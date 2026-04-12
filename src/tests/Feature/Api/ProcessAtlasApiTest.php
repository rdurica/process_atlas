<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

it('creates a workflow and edits screen properties via api', function (): void {
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Checkout Platform',
        'description' => 'Workflow playground',
    ])->assertCreated();

    $projectId = $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Checkout Flow',
    ])->assertCreated();

    $workflowId = $workflowResponse->json('data.id');

    $workflowShow = $this->getJson("/api/v1/workflows/{$workflowId}")->assertOk();

    $versionId = (int) $workflowShow->json('data.latest_version.id');

    $this->patchJson("/api/v1/workflow-versions/{$versionId}/graph", [
        'graph_json' => [
            'nodes' => [
                ['id' => 'screen-1', 'data' => ['label' => 'Start'], 'position' => ['x' => 100, 'y' => 100]],
            ],
            'edges' => [],
        ],
        'lock_version' => 0,
    ])->assertOk()->assertJsonPath('data.lock_version', 1);

    $screenResponse = $this->postJson('/api/v1/screens/upsert', [
        'workflow_version_id' => $versionId,
        'node_id' => 'screen-1',
        'title' => 'Checkout Start',
        'subtitle' => 'Card capture',
        'description' => 'The first checkout step.',
    ])->assertOk()
        ->assertJsonPath('data.subtitle', 'Card capture');

    $screenId = $screenResponse->json('data.id');

    $this->postJson("/api/v1/screens/{$screenId}/custom-fields/upsert", [
        'key' => 'api_endpoint',
        'value' => '/v1/checkout/start',
        'field_type' => 'text',
    ])->assertOk();

    $screenShow = $this->getJson("/api/v1/screens/{$screenId}")->assertOk();
    expect($screenShow->json('data'))->not->toHaveKey('flashes');
    expect($screenShow->json('data.custom_fields'))->toHaveCount(1);

    $draftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/versions")
        ->assertCreated();

    $draftVersionId = (int) $draftResponse->json('data.id');

    $draftVersion = $this->getJson("/api/v1/workflow-versions/{$draftVersionId}")
        ->assertOk();

    expect($draftVersion->json('data.screens.0.subtitle'))->toBe('Card capture');
    expect($draftVersion->json('data.screens.0'))->not->toHaveKey('flashes');
});

it('denies project creation for viewer role', function (): void {
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();
    $this->actingAs($viewer);

    $this->postJson('/api/v1/projects', [
        'name' => 'Not Allowed',
    ])->assertForbidden();
});

it('allows project creation for editor role', function (): void {
    $editor = User::factory()->create([
        'email' => 'editor@example.com',
    ]);
    $editor->assignRole('editor');

    $this->actingAs($editor);

    $this->postJson('/api/v1/projects', [
        'name' => 'Allowed for editor',
    ])->assertCreated();
});

it('handles mcp requests over api endpoint', function (): void {
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $token = $owner->createToken('mcp-test')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/mcp', [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'list_projects',
            'params' => [],
        ])
        ->assertOk()
        ->assertJsonPath('jsonrpc', '2.0')
        ->assertJsonStructure(['result' => ['projects']]);
});
