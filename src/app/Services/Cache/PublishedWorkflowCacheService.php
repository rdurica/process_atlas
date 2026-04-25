<?php

namespace App\Services\Cache;

use Illuminate\Support\Facades\Cache;

final class PublishedWorkflowCacheService
{
    private const string KEY_PREFIX = 'published_workflow.';

    private readonly int $ttlSeconds;

    public function __construct()
    {
        $this->ttlSeconds = (int) config('cache.ttl.published_workflow', 3600);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function get(int $workflowId): ?array
    {
        return Cache::get($this->key($workflowId));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function put(int $workflowId, array $data): void
    {
        Cache::put($this->key($workflowId), $data, $this->ttlSeconds);
    }

    public function forget(int $workflowId): void
    {
        Cache::forget($this->key($workflowId));
    }

    private function key(int $workflowId): string
    {
        return self::KEY_PREFIX . $workflowId;
    }
}
