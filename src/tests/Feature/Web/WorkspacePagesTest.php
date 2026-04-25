<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void
{
    $this->seed();
});

it('renders dashboard with enterprise summary and activity props', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name'        => 'Checkout Platform',
        'description' => 'Workflow orchestration for payments.',
    ])->assertCreated();

    $projectId = $projectResponse->json('data.id');

    $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Checkout Flow',
    ])->assertCreated();

    $this->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('summary.projects', 1)
            ->where('summary.workflows', 1)
            ->has('projects', 1)
            ->where('projects.0.name', 'Checkout Platform')
            ->where('projects.0.latest_revision_label', 'rev. 1')
            ->has('projects.0.workflows', 1)
            ->has('recentActivity')
            ->where('recentActivity', fn ($activities): bool => collect($activities)->contains(
                fn ($activity): bool => ($activity['subject_label'] ?? null) === 'Checkout Flow',
            ),
            ));
});

it('shares read only permissions for viewer dashboard access', function (): void
{
    $viewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();
    $this->actingAs($viewer);

    $this->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('auth.user.permissions', fn ($permissions): bool => collect($permissions)->contains('projects.view')
                && collect($permissions)->contains('workflows.view')
                && ! collect($permissions)->contains('projects.manage')
                && ! collect($permissions)->contains('workflows.edit'),
            ));
});

it('renders workflow editor with recent activity and version metadata', function (): void
{
    $owner = User::query()->where('email', 'owner@example.com')->firstOrFail();
    $this->actingAs($owner);

    $projectResponse = $this->postJson('/api/v1/projects', [
        'name' => 'Claims Platform',
    ])->assertCreated();

    $projectId = $projectResponse->json('data.id');

    $workflowResponse = $this->postJson("/api/v1/projects/{$projectId}/workflows", [
        'name' => 'Claims Intake',
    ])->assertCreated();

    $workflowId = $workflowResponse->json('data.id');

    $workflowShow = $this->getJson("/api/v1/workflows/{$workflowId}")->assertOk();
    $versionId = (int) $workflowShow->json('data.latest_revision.id');

    $this->patchJson("/api/v1/workflow-revisions/{$versionId}/graph", [
        'graph_json' => [
            'nodes' => [
                ['id' => 'screen-1', 'data' => ['label' => 'Start'], 'position' => ['x' => 80, 'y' => 80]],
            ],
            'edges' => [],
        ],
        'lock_version' => 0,
    ])->assertOk();

    $this->get("/workflows/{$workflowId}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('WorkflowEditor')
            ->where('workflow.name', 'Claims Intake')
            ->has('workflow.revisions', 1)
            ->where('workflow.revisions.0.creator.name', 'Owner')
            ->has('recentActivity')
            ->where('recentActivity', fn ($activities): bool => collect($activities)->contains(
                fn ($activity): bool => ($activity['subject_label'] ?? null) === 'rev. 1',
            ),
            ));
});
