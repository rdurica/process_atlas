<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function (): void
{
    $this->seed();
});

it('caches published workflow data after first api request', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Cache Test Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Cache Test Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $versionId = (int) $workflowResponse->json('data.latest_version.id');

    $this->postJson("/api/v1/workflow-versions/{$versionId}/publish")
        ->assertOk();

    $cacheKey = 'published_workflow.' . $workflowId;
    expect(Cache::get($cacheKey))->toBeNull();

    $response = $this->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk();

    $cached = Cache::get($cacheKey);
    expect($cached)->not->toBeNull();
    expect($cached['id'])->toBe($workflowId);
    expect($cached['published_version']['id'])->toBe($versionId);
    expect($cached['published_version']['screens'])->toBeArray();
});

it('invalidates cache when workflow is archived', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Cache Invalidation Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Cache Invalidation Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $versionId = (int) $workflowResponse->json('data.latest_version.id');

    $this->postJson("/api/v1/workflow-versions/{$versionId}/publish")
        ->assertOk();

    $this->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk();

    $cacheKey = 'published_workflow.' . $workflowId;
    expect(Cache::get($cacheKey))->not->toBeNull();

    $this->postJson("/api/v1/workflows/{$workflowId}/archive")
        ->assertOk();

    expect(Cache::get($cacheKey))->toBeNull();
});

it('invalidates cache when a new version is published', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Republish Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Republish Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $versionId = (int) $workflowResponse->json('data.latest_version.id');

    $this->postJson("/api/v1/workflow-versions/{$versionId}/publish")
        ->assertOk();

    $this->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk();

    $cacheKey = 'published_workflow.' . $workflowId;
    $firstCached = Cache::get($cacheKey);
    expect($firstCached)->not->toBeNull();

    $draftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/versions")
        ->assertCreated();
    $draftVersionId = (int) $draftResponse->json('data.id');

    $this->postJson("/api/v1/workflow-versions/{$draftVersionId}/publish")
        ->assertOk();

    expect(Cache::get($cacheKey))->toBeNull();

    $response = $this->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk();

    $secondCached = Cache::get($cacheKey);
    expect($secondCached)->not->toBeNull();
    expect($secondCached['published_version']['id'])->toBe($draftVersionId);
});
