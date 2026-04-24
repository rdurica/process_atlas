<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void
{
    $this->seed();
});

it('promotes viewer users to editor while preserving fixture viewer and owners', function (): void
{
    $viewerToPromote = User::factory()->create([
        'email' => 'legacy-viewer@example.com',
    ]);
    $viewerToPromote->assignRole('viewer');

    $owner = User::factory()->create([
        'email' => 'owner-with-viewer@example.com',
    ]);
    $owner->assignRole('process_owner');
    $owner->assignRole('viewer');

    $fixtureViewer = User::query()->where('email', 'viewer@example.com')->firstOrFail();

    $this->artisan('users:backfill-editors')
        ->expectsOutputToContain('promoted=1')
        ->assertSuccessful();

    $viewerToPromote->refresh();
    $owner->refresh();
    $fixtureViewer->refresh();

    expect($viewerToPromote->hasRole('editor'))->toBeTrue();
    expect($viewerToPromote->hasRole('viewer'))->toBeFalse();

    expect($owner->hasRole('process_owner'))->toBeTrue();
    expect($owner->hasRole('viewer'))->toBeTrue();

    expect($fixtureViewer->hasRole('viewer'))->toBeTrue();
    expect($fixtureViewer->hasRole('editor'))->toBeFalse();
});

it('supports dry run mode without mutating roles', function (): void
{
    $viewerToPromote = User::factory()->create([
        'email' => 'dry-run-viewer@example.com',
    ]);
    $viewerToPromote->assignRole('viewer');

    $this->artisan('users:backfill-editors --dry-run')
        ->expectsOutputToContain('dry_run=yes')
        ->assertSuccessful();

    $viewerToPromote->refresh();

    expect($viewerToPromote->hasRole('viewer'))->toBeTrue();
    expect($viewerToPromote->hasRole('editor'))->toBeFalse();
});
