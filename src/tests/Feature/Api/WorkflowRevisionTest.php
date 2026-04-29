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

it('creates a draft from the requested source revision', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Source Draft Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Source Draft Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');
    $initialRevisionId = (int) $workflowResponse->json('data.latest_revision.id');

    $this->patchJson("/api/v1/workflow-revisions/{$initialRevisionId}/graph", [
        'graph_json' => [
            'nodes' => [
                ['id' => 'baseline', 'type' => 'start', 'data' => ['label' => 'Baseline'], 'position' => ['x' => 0, 'y' => 0]],
            ],
            'edges' => [],
        ],
        'lock_version' => 0,
    ])->assertOk();

    $this->postJson("/api/v1/workflow-revisions/{$initialRevisionId}/publish")
        ->assertOk();

    $changedDraftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/revisions")
        ->assertCreated();
    $changedDraftId = (int) $changedDraftResponse->json('data.id');

    $this->patchJson("/api/v1/workflow-revisions/{$changedDraftId}/graph", [
        'graph_json' => [
            'nodes' => [
                ['id' => 'changed-draft', 'type' => 'start', 'data' => ['label' => 'Changed'], 'position' => ['x' => 0, 'y' => 0]],
            ],
            'edges' => [],
        ],
        'lock_version' => 0,
    ])->assertOk();

    $sourceDraftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/revisions", [
        'draft_name'         => 'From published rev',
        'source_revision_id' => $initialRevisionId,
    ])->assertCreated()
        ->assertJsonPath('data.source_revision_id', $initialRevisionId);
    $sourceDraftId = (int) $sourceDraftResponse->json('data.id');

    $sourceDraft = $this->getJson("/api/v1/workflow-revisions/{$sourceDraftId}")
        ->assertOk();

    expect($sourceDraft->json('data.graph_json.nodes.0.id'))->toBe('baseline');
});

it('assigns the next revision number when publishing a draft', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Revision Number Project',
    ])->assertCreated();
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Revision Number Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');
    $initialRevisionId = (int) $workflowResponse->json('data.latest_revision.id');

    $this->postJson("/api/v1/workflow-revisions/{$initialRevisionId}/publish")
        ->assertOk()
        ->assertJsonPath('data.revision_number', 1);

    $draftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/revisions")
        ->assertCreated();
    $draftRevisionId = (int) $draftResponse->json('data.id');

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
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Delete Latest Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');
    $initialRevisionId = (int) $workflowResponse->json('data.latest_revision.id');

    $draftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/revisions")
        ->assertCreated();
    $draftRevisionId = (int) $draftResponse->json('data.id');

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
    $projectId = (int) $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Switch Draft Workflow',
    ])->assertCreated();
    $workflowId = (int) $workflowResponse->json('data.id');

    $firstDraftResponse = $this->postJson("/api/v1/workflows/{$workflowId}/revisions", [
        'draft_name' => 'First candidate',
    ])->assertCreated();
    $firstDraftId = (int) $firstDraftResponse->json('data.id');

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
