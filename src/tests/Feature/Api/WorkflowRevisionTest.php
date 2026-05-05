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
    $projectId = $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Lock Test Workflow',
    ])->assertCreated();
    $workflowId = $workflowResponse->json('data.id');

    $workflowShow = $this->getJson("/api/v1/workflows/{$workflowId}")->assertOk();
    $revisionId = $workflowShow->json('data.latest_revision.id');

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
    $projectId = $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Delete Lock Workflow',
    ])->assertCreated();
    $workflowId = $workflowResponse->json('data.id');

    $workflowShow = $this->getJson("/api/v1/workflows/{$workflowId}")->assertOk();
    $revisionId = $workflowShow->json('data.latest_revision.id');

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
    $projectId = $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Delete Draft Workflow',
    ])->assertCreated();
    $workflowId = $workflowResponse->json('data.id');

    // Create initial revision + one draft
    $this->postJson("/api/v1/workflows/{$workflowId}/revisions")
        ->assertCreated();

    $workflowShow = $this->getJson("/api/v1/workflows/{$workflowId}")->assertOk();
    $latestRevisionId = $workflowShow->json('data.latest_revision.id');

    // Publish the latest so the older one becomes locked
    $this->postJson("/api/v1/workflow-revisions/{$latestRevisionId}/publish")
        ->assertOk();

    // Create a new draft from the published revision
    $draftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/revisions")
        ->assertCreated();
    $draftRevisionId = $draftResponse->json('data.id');

    $this->postJson("/api/v1/workflow-revisions/{$draftRevisionId}/publish")
        ->assertOk()
        ->assertJsonPath('data.revision_number', 2)
        ->assertJsonPath('data.draft_name', null)
        ->assertJsonPath('data.source_revision_id', null);
});

it('updates latest revision when deleting the current draft', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Delete Latest Project',
    ])->assertCreated();
    $projectId = $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Delete Latest Workflow',
    ])->assertCreated();
    $workflowId = $workflowResponse->json('data.id');
    $initialRevisionId = $workflowResponse->json('data.latest_revision.id');

    $draftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/revisions")
        ->assertCreated();
    $draftRevisionId = $draftResponse->json('data.id');

    $this->deleteJson("/api/v1/workflow-revisions/{$draftRevisionId}")
        ->assertNoContent();

    $this->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk()
        ->assertJsonPath('data.latest_revision.id', $initialRevisionId)
        ->assertJsonPath('data.status', 'draft');
});

it('switches the active latest revision to an existing draft', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Switch Draft Project',
    ])->assertCreated();
    $projectId = $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Switch Draft Workflow',
    ])->assertCreated();
    $workflowId = $workflowResponse->json('data.id');

    $firstDraftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/revisions", [
        'draft_name' => 'First candidate',
    ])->assertCreated();
    $firstDraftId = $firstDraftResponse->json('data.id');

    $this->postJson("/api/v1/workflows/{$workflowId}/revisions", [
        'draft_name' => 'Second candidate',
    ])->assertCreated();

    $this->postJson("/api/v1/workflow-revisions/{$firstDraftId}/switch-to-draft")
        ->assertOk()
        ->assertJsonPath('data.id', $firstDraftId);

    $this->getJson("/api/v1/workflows/{$workflowId}")
        ->assertOk()
        ->assertJsonPath('data.latest_revision.id', $firstDraftId)
        ->assertJsonPath('data.status', 'draft');
});
