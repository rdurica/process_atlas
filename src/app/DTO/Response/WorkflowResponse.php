<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Models\Workflow;
use Carbon\Carbon;
use JsonSerializable;

final readonly class WorkflowResponse implements JsonSerializable
{
    public function __construct(
        public int $id,
        public string $name,
        public string $status,
        public ?int $latestVersionId,
        public ?int $publishedVersionId,
        public ?string $archivedAt,
        public ?array $latestVersion,
        public ?array $publishedVersion,
    ) {}

    public static function fromModel(Workflow $workflow): self
    {
        return new self(
            id: $workflow->id,
            name: $workflow->name,
            status: $workflow->status,
            latestVersionId: $workflow->latest_version_id,
            publishedVersionId: $workflow->published_version_id,
            /** @phpstan-ignore-next-line */
            archivedAt: $workflow->archived_at instanceof Carbon
                ? $workflow->archived_at->toIso8601String()
                : $workflow->archived_at,
            latestVersion: $workflow->relationLoaded('latestVersion') && $workflow->latestVersion !== null
                ? $workflow->latestVersion->toArray()
                : null,
            publishedVersion: $workflow->relationLoaded('publishedVersion') && $workflow->publishedVersion !== null
                ? $workflow->publishedVersion->toArray()
                : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'                   => $this->id,
            'name'                 => $this->name,
            'status'               => $this->status,
            'latest_version_id'    => $this->latestVersionId,
            'published_version_id' => $this->publishedVersionId,
            'archived_at'          => $this->archivedAt,
            'latest_version'       => $this->latestVersion,
            'published_version'    => $this->publishedVersion,
        ];
    }
}
