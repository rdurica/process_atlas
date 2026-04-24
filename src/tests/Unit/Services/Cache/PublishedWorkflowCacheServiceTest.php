<?php

use App\Services\Cache\PublishedWorkflowCacheService;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class);

it('stores and retrieves published workflow data', function (): void
{
    $service = new PublishedWorkflowCacheService;

    expect($service->get(1))->toBeNull();

    $data = [
        'id'                => 1,
        'name'              => 'Test Workflow',
        'published_version' => [
            'id'             => 10,
            'version_number' => 1,
            'graph_json'     => ['nodes' => [], 'edges' => []],
            'screens'        => [],
        ],
    ];

    $service->put(1, $data);

    expect($service->get(1))->toBe($data);
});

it('forgets cached data', function (): void
{
    $service = new PublishedWorkflowCacheService;

    $service->put(1, ['id' => 1]);
    expect($service->get(1))->not->toBeNull();

    $service->forget(1);
    expect($service->get(1))->toBeNull();
});

it('uses the configured ttl', function (): void
{
    config()->set('cache.ttl.published_workflow', 7200);

    $service = new PublishedWorkflowCacheService;

    $service->put(1, ['id' => 1]);

    expect(Cache::get('published_workflow.1'))->not->toBeNull();
});
