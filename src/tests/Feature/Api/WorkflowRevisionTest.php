<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void
{
    $this->seed();
});

it('locks a revision when publishing', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Lock Test Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Lock Test Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $workflowShow = $this->getJson("/api/v1/workflows/{$workflowId}")->assertOk();
    $revisionId = (int) $workflowShow->json('data.latest_revision.id');

    $this->postJson("/api/v1/workflow-revisions/{$revisionId}/publish")
        ->assertOk()
        ->assertJsonPath('data.is_locked', true)
        ->assertJsonPath('data.is_published', true);

    $this->getJson("/api/v1/workflow-revisions/{$revisionId}")
        ->assertOk()
        ->assertJsonPath('data.is_locked', true);
});

it('prevents deleting a locked revision', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Delete Lock Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Delete Lock Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $workflowShow = $this->getJson("/api/v1/workflows/{$workflowId}")->assertOk();
    $revisionId = (int) $workflowShow->json('data.latest_revision.id');

    $this->postJson("/api/v1/workflow-revisions/{$revisionId}/publish")
        ->assertOk();

    $this->deleteJson("/api/v1/workflow-revisions/{$revisionId}")
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Cannot delete a locked revision.');
});

it('allows deleting a non-locked draft revision', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Delete Draft Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Delete Draft Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    // Create initial revision + one draft
    $this->postJson("/api/v1/workflows/{$workflowId}/revisions")
        ->assertCreated();

    $workflowShow = $this->getJson("/api/v1/workflows/{$workflowId}")->assertOk();
    $latestRevisionId = (int) $workflowShow->json('data.latest_revision.id');

    // Publish the latest so the older one becomes locked
    $this->postJson("/api/v1/workflow-revisions/{$latestRevisionId}/publish")
        ->assertOk();

    // Create a new draft from the published revision
    $draftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/revisions")
        ->assertCreated();
    $draftRevisionId = (int) $draftResponse->json('data.id');

    // Verify the draft is not locked
    $this->getJson("/api/v1/workflow-revisions/{$draftRevisionId}")
        ->assertOk()
        ->assertJsonPath('data.is_locked', false);

    // Delete the draft
    $this->deleteJson("/api/v1/workflow-revisions/{$draftRevisionId}")
        ->assertNoContent();
});
