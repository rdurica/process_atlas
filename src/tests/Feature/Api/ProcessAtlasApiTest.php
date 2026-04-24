<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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

it('does not allow direct workflow status updates', function (): void {
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Status Guard Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Status Guard Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $this->patchJson("/api/v1/workflows/{$workflowId}", [
        'status' => 'published',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('status');

    $this->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk()
        ->assertJsonPath('data.status', 'draft');
});

it('prevents demoting the last process owner in a project', function (): void {
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Ownership Guard Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $this->patchJson("/api/v1/projects/{$projectId}/members/{$owner->id}", [
        'role' => 'viewer',
    ])->assertUnprocessable();

    $secondOwner = User::factory()->create(['email' => 'second-owner@example.com']);

    $this->postJson("/api/v1/projects/{$projectId}/members", [
        'email' => $secondOwner->email,
        'role' => 'process_owner',
    ])->assertCreated();

    $this->patchJson("/api/v1/projects/{$projectId}/members/{$owner->id}", [
        'role' => 'viewer',
    ])->assertOk()
        ->assertJsonPath('data.role', 'viewer');
});

it('keeps screen image metadata when creating a draft revision', function (): void {
    Storage::fake('public');

    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Image Clone Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Image Clone Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $workflowShow = $this->getJson("/api/v1/workflows/{$workflowId}")->assertOk();
    $versionId = (int) $workflowShow->json('data.latest_version.id');

    $screenResponse = $this->post('/api/v1/screens/upsert', [
        'workflow_version_id' => $versionId,
        'node_id' => 'screen-image-1',
        'title' => 'Image screen',
        'image' => UploadedFile::fake()->image('screen.png', 800, 600),
    ])->assertOk();

    $imagePath = $screenResponse->json('data.image_path');
    expect($imagePath)->not->toBeNull();
    Storage::disk('public')->assertExists($imagePath);

    $draftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/versions")
        ->assertCreated();
    $draftVersionId = (int) $draftResponse->json('data.id');

    $this->getJson("/api/v1/workflow-versions/{$draftVersionId}")
        ->assertOk()
        ->assertJsonPath('data.screens.0.image_path', $imagePath);
});

it('handles standard mcp initialize requests over api endpoint', function (): void {
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $token = $owner->createToken('mcp-test', ['mcp:use'])->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/mcp', [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'initialize',
            'params' => [
                'protocolVersion' => '2024-11-05',
                'capabilities' => [],
                'clientInfo' => [
                    'name' => 'feature-test',
                    'version' => '1.0.0',
                ],
            ],
        ]);

    $response
        ->assertOk()
        ->assertJsonPath('jsonrpc', '2.0')
        ->assertJsonPath('result.protocolVersion', '2024-11-05')
        ->assertJsonPath('result.serverInfo.name', 'process-atlas')
        ->assertJsonPath('result.capabilities.tools.listChanged', false);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/mcp', [
            'jsonrpc' => '2.0',
            'method' => 'notifications/initialized',
            'params' => [],
        ])
        ->assertNoContent();
});

it('lists and reads mcp resources over api endpoint', function (): void {
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'MCP Resource Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'MCP Resource Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $token = $owner->createToken('mcp-test-resources', ['mcp:use'])->plainTextToken;

    $resourcesResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/mcp', [
            'jsonrpc' => '2.0',
            'id' => 2,
            'method' => 'resources/list',
            'params' => [],
        ])
        ->assertOk()
        ->assertJsonPath('jsonrpc', '2.0');

    expect($resourcesResponse->json('result.resources'))->toBeArray();
    expect(collect($resourcesResponse->json('result.resources'))->contains(
        fn (array $resource): bool => ($resource['uri'] ?? null) === "process-atlas://projects/{$projectId}"
    ))->toBeTrue();

    $readResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/mcp', [
            'jsonrpc' => '2.0',
            'id' => 3,
            'method' => 'resources/read',
            'params' => ['uri' => "process-atlas://workflows/{$workflowId}"],
        ])
        ->assertOk()
        ->assertJsonPath('result.contents.0.uri', "process-atlas://workflows/{$workflowId}");

    $payload = json_decode((string) $readResponse->json('result.contents.0.text'), true);
    expect(data_get($payload, 'workflow.id'))->toBe($workflowId);
});

it('calls mcp tools and reports revision conflicts', function (): void {
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'MCP Tool Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'MCP Tool Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $workflowShow = $this->getJson("/api/v1/workflows/{$workflowId}")->assertOk();
    $revisionId = (int) $workflowShow->json('data.latest_version.id');

    $token = $owner->createToken('mcp-test-tools', ['mcp:use'])->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/mcp', [
            'jsonrpc' => '2.0',
            'id' => 4,
            'method' => 'tools/call',
            'params' => [
                'name' => 'process_atlas.update_graph',
                'arguments' => [
                    'workflow_revision_id' => $revisionId,
                    'lock_revision' => 0,
                    'graph_json' => [
                        'nodes' => [],
                        'edges' => [],
                    ],
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('result.structuredContent.workflow_revision_id', $revisionId)
        ->assertJsonPath('result.structuredContent.lock_revision', 1);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/mcp', [
            'jsonrpc' => '2.0',
            'id' => 5,
            'method' => 'tools/call',
            'params' => [
                'name' => 'process_atlas.update_graph',
                'arguments' => [
                    'workflow_revision_id' => $revisionId,
                    'lock_revision' => 0,
                    'graph_json' => [
                        'nodes' => [],
                        'edges' => [],
                    ],
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('error.code', -32602)
        ->assertJsonPath('error.message', 'Revision conflict. Reload the latest draft and retry.');
});

it('forbids mcp access without mcp.use permission', function (): void {
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();
    $token = $viewer->createToken('mcp-test-forbidden', ['mcp:use'])->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/mcp', [
            'jsonrpc' => '2.0',
            'id' => 6,
            'method' => 'initialize',
            'params' => [],
        ])
        ->assertForbidden();
});
