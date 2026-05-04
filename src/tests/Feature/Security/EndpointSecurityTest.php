<?php

use App\Console\Commands\McpServeStdioCommand;
use App\Models\User;
use Illuminate\Console\OutputStyle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;

uses(RefreshDatabase::class);

beforeEach(function (): void
{
    $this->seed();
});

it('forbids unverified users from accessing api routes', function (): void
{
    $user = User::factory()->unverified()->create();
    $user->assignRole('user');

    $token = $user->createToken('api-test')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/projects')
        ->assertForbidden();
});

it('forbids unverified users from accessing mcp route', function (): void
{
    $user = User::factory()->unverified()->create();
    $user->assignRole('user');

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

it('scopes dashboard activity to projects visible to the current user', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $viewer = User::query()->where('email', 'user@example.com')->firstOrFail();

    $projectResponse = $this->actingAs($owner)
        ->postJson('/api/v1/projects', [
            'name' => 'Private Activity Project',
        ])
        ->assertCreated();

    $projectId = (int) $projectResponse->json('data.id');

    $this->actingAs($owner)
        ->postJson("/api/v1/projects/{$projectId}/workflows", [
            'name' => 'Private Activity Workflow',
        ])
        ->assertCreated();

    $this->actingAs($viewer)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('recentActivity', fn ($activities): bool => ! collect($activities)->contains(
                fn ($activity): bool => ($activity['subject_label'] ?? null) === 'Private Activity Workflow'
                    || ($activity['subject_label'] ?? null) === 'Private Activity Project',
            )),
        );
});

it('does not expose archived public projects to non-members through list endpoints', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $viewer = User::query()->where('email', 'user@example.com')->firstOrFail();

    $projectResponse = $this->actingAs($owner)
        ->postJson('/api/v1/projects', [
            'name'      => 'Archived Public Project',
            'is_public' => true,
        ])
        ->assertCreated();

    $projectId = (int) $projectResponse->json('data.id');

    $this->actingAs($owner)
        ->postJson("/api/v1/projects/{$projectId}/archive")
        ->assertOk();

    $this->actingAs($viewer)
        ->getJson('/api/v1/projects?include_archived=1')
        ->assertOk()
        ->assertJsonMissing(['id' => $projectId]);

    $this->actingAs($viewer)
        ->get('/dashboard?include_archived=1')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('projects', fn ($projects): bool => ! collect($projects)->contains(
                fn ($project): bool => ($project['id'] ?? null) === $projectId,
            )),
        );
});

it('preserves production api auth authorization validation and not found statuses', function (): void
{
    config(['app.debug' => false]);

    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $viewer = User::query()->where('email', 'user@example.com')->firstOrFail();

    $this->getJson('/api/v1/projects')
        ->assertUnauthorized();

    $this->actingAs($viewer)
        ->postJson('/api/v1/projects', ['name' => 'Forbidden Project'])
        ->assertForbidden();

    $this->actingAs($owner)
        ->postJson('/api/v1/projects', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('name');

    $this->actingAs($owner)
        ->getJson('/api/v1/projects/999999')
        ->assertNotFound();
});

it('caps api list pagination size', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();

    $projectResponse = $this->actingAs($owner)
        ->postJson('/api/v1/projects', ['name' => 'Pagination Guard'])
        ->assertCreated();

    $projectId = (int) $projectResponse->json('data.id');

    $this->actingAs($owner)
        ->getJson('/api/v1/projects?per_page=101')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('per_page');

    $this->actingAs($owner)
        ->getJson("/api/v1/projects/{$projectId}/workflows?per_page=101")
        ->assertUnprocessable()
        ->assertJsonValidationErrors('per_page');
});

it('rejects oversized image dimensions before screen upload processing', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();

    $projectResponse = $this->actingAs($owner)
        ->postJson('/api/v1/projects', ['name' => 'Upload Guard Project'])
        ->assertCreated();

    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->actingAs($owner)
        ->postJson("/api/v1/projects/{$projectId}/workflows", [
            'name' => 'Upload Guard Workflow',
        ])
        ->assertCreated();

    $workflowId = (int) $workflowResponse->json('data.id');
    $workflowShow = $this->actingAs($owner)
        ->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk();
    $revisionId = (int) $workflowShow->json('data.latest_revision.id');

    $this->actingAs($owner)
        ->withHeader('Accept', 'application/json')
        ->post('/api/v1/screens/upsert', [
            'workflow_revision_id' => $revisionId,
            'node_id'              => 'oversized-image',
            'image'                => UploadedFile::fake()->image('oversized.png', 4097, 100),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('image');
});

it('requires mcp stdio tokens to be unexpired and scoped with mcp ability', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();

    $resolveActor = function (): ?User
    {
        $command = app(McpServeStdioCommand::class);
        $command->setOutput(new OutputStyle(
            new ArrayInput([]),
            new BufferedOutput,
        ));

        $method = new ReflectionMethod($command, 'resolveActor');
        $method->setAccessible(true);

        $actor = $method->invoke($command);

        return $actor instanceof User ? $actor : null;
    };

    config([
        'services.mcp.token'   => $owner->createToken('mcp', ['mcp:use'], now()->subMinute())->plainTextToken,
        'services.mcp.user_id' => 0,
    ]);

    expect($resolveActor())->toBeNull();

    config([
        'services.mcp.token' => $owner->createToken('mcp', ['wrong:ability'], now()->addMinute())->plainTextToken,
    ]);

    expect($resolveActor())->toBeNull();

    config([
        'services.mcp.token' => $owner->createToken('mcp', ['mcp:use'], now()->addMinute())->plainTextToken,
    ]);

    expect($resolveActor()?->is($owner))->toBeTrue();
});
