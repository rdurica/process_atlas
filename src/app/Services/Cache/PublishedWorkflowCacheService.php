<?php

namespace App\Services\Cache;

use Illuminate\Support\Facades\Cache;

final class PublishedWorkflowCacheService
{
    private const string KEY_PREFIX = 'published_workflow_v2.';

    private readonly int $ttlSeconds;

    public function __construct()
    {
        $this->ttlSeconds = (int) config('cache.ttl.published_workflow', 3600);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function get(string $workflowUuid): ?array
    {
        return Cache::get($this->key($workflowUuid));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function put(string $workflowUuid, array $data): void
    {
        Cache::put($this->key($workflowUuid), $data, $this->ttlSeconds);
    }

    public function forget(string $workflowUuid): void
    {
        Cache::forget($this->key($workflowUuid));
    }

    private function key(string $workflowUuid): string
    {
        return self::KEY_PREFIX . $workflowUuid;
    }
}
