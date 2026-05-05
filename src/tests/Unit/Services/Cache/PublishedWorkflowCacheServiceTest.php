<?php

use App\Services\Cache\PublishedWorkflowCacheService;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function (): void
{
    Cache::flush();
});

it('stores and retrieves published workflow data', function (): void
{
    $service = new PublishedWorkflowCacheService;
    $uuid = '019df97e-0000-7000-8000-000000000001';

    expect($service->get($uuid))->toBeNull();

    $data = [
        'id'                 => $uuid,
        'name'               => 'Test Workflow',
        'published_revision' => [
            'id'              => '019df97e-0000-7000-8000-000000000010',
            'revision_number' => 1,
            'graph_json'      => ['nodes' => [], 'edges' => []],
            'screens'         => [],
        ],
    ];

    $service->put($uuid, $data);

    expect($service->get($uuid))->toBe($data);
});

it('forgets cached data', function (): void
{
    $service = new PublishedWorkflowCacheService;
    $uuid = '019df97e-0000-7000-8000-000000000002';

    $service->put($uuid, ['id' => $uuid]);
    expect($service->get($uuid))->not->toBeNull();

    $service->forget($uuid);
    expect($service->get($uuid))->toBeNull();
});

it('uses the configured ttl', function (): void
{
    config()->set('cache.ttl.published_workflow', 7200);

    $service = new PublishedWorkflowCacheService;
    $uuid = '019df97e-0000-7000-8000-000000000003';

    $service->put($uuid, ['id' => $uuid]);

    expect($service->get($uuid))->not->toBeNull();
});
