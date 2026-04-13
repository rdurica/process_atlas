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
                [
                    'id' => 'start-1',
                    'type' => 'start',
                    'data' => ['label' => 'Start', 'security_rule' => 'agent.context.region == "EU"'],
                    'position' => ['x' => 20, 'y' => 100],
                ],
                [
                    'id' => 'action-1',
                    'type' => 'action',
                    'data' => ['title' => 'Verify Risk', 'security_rule' => 'agent.trust_score >= 0.7'],
                    'position' => ['x' => 190, 'y' => 100],
                ],
                [
                    'id' => 'screen-1',
                    'type' => 'screen',
                    'data' => ['label' => 'Start', 'security_rule' => 'user.department == "finance"'],
                    'position' => ['x' => 360, 'y' => 100],
                ],
            ],
            'edges' => [
                ['id' => 'e-start-action', 'source' => 'start-1', 'target' => 'action-1'],
                ['id' => 'e-action-screen', 'source' => 'action-1', 'target' => 'screen-1'],
            ],
        ],
        'lock_version' => 0,
    ])->assertOk()->assertJsonPath('data.lock_version', 1);

    $savedVersion = $this->getJson("/api/v1/workflow-versions/{$versionId}")
        ->assertOk();

    $savedNodes = collect($savedVersion->json('data.graph_json.nodes'));

    expect(data_get($savedNodes->firstWhere('id', 'start-1'), 'data.security_rule'))
        ->toBe('agent.context.region == "EU"');
    expect(data_get($savedNodes->firstWhere('id', 'action-1'), 'data.security_rule'))
        ->toBe('agent.trust_score >= 0.7');
    expect(data_get($savedNodes->firstWhere('id', 'screen-1'), 'data.security_rule'))
        ->toBe('user.department == "finance"');

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
    $draftNodes = collect($draftVersion->json('data.graph_json.nodes'));
    expect(data_get($draftNodes->firstWhere('id', 'start-1'), 'data.security_rule'))
        ->toBe('agent.context.region == "EU"');
    expect(data_get($draftNodes->firstWhere('id', 'action-1'), 'data.security_rule'))
        ->toBe('agent.trust_score >= 0.7');
    expect(data_get($draftNodes->firstWhere('id', 'screen-1'), 'data.security_rule'))
        ->toBe('user.department == "finance"');
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
