<?php

use App\Models\User;
use App\Services\Cache\PublishedWorkflowCacheService;
use Illuminate\Foundation\Testing\RefreshDatabase;

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
    $projectId = $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Cache Test Workflow',
    ])->assertCreated();
    $workflowId = $workflowResponse->json('data.id');

    $versionId = $workflowResponse->json('data.latest_revision.id');

    $this->postJson("/api/v1/workflow-revisions/{$versionId}/publish")
        ->assertOk();

    $service = new PublishedWorkflowCacheService;
    expect($service->get($workflowId))->toBeNull();

    $response = $this->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk();

    $cached = $service->get($workflowId);
    expect($cached)->not->toBeNull();
    expect($cached['id'])->toBe($workflowId);
    expect($cached['published_revision']['id'])->toBe($versionId);
    expect($cached['published_revision']['screens'])->toBeArray();
});

it('invalidates cache when workflow is archived', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Cache Invalidation Project',
    ])->assertCreated();
    $projectId = $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Cache Invalidation Workflow',
    ])->assertCreated();
    $workflowId = $workflowResponse->json('data.id');

    $versionId = $workflowResponse->json('data.latest_revision.id');

    $this->postJson("/api/v1/workflow-revisions/{$versionId}/publish")
        ->assertOk();

    $this->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk();

    $service = new PublishedWorkflowCacheService;
    expect($service->get($workflowId))->not->toBeNull();

    $this->postJson("/api/v1/workflows/{$workflowId}/archive")
        ->assertOk();

    expect($service->get($workflowId))->toBeNull();
});

it('invalidates cache when a new version is published', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Republish Project',
    ])->assertCreated();
    $projectId = $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Republish Workflow',
    ])->assertCreated();
    $workflowId = $workflowResponse->json('data.id');

    $versionId = $workflowResponse->json('data.latest_revision.id');

    $this->postJson("/api/v1/workflow-revisions/{$versionId}/publish")
        ->assertOk();

    $this->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk();

    $service = new PublishedWorkflowCacheService;
    $firstCached = $service->get($workflowId);
    expect($firstCached)->not->toBeNull();

    $draftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/revisions")
        ->assertCreated();
    $draftVersionId = $draftResponse->json('data.id');

    $this->postJson("/api/v1/workflow-revisions/{$draftVersionId}/publish")
        ->assertOk();

    expect($service->get($workflowId))->toBeNull();

    $response = $this->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk();

    $secondCached = $service->get($workflowId);
    expect($secondCached)->not->toBeNull();
    expect($secondCached['published_revision']['id'])->toBe($draftVersionId);
});
