<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Models\Workflow;
use Carbon\Carbon;
use JsonSerializable;

final readonly class WorkflowResponse implements JsonSerializable
{
    public function __construct(
        public string $id,
        public string $name,
        public string $status,
        public ?string $latestRevisionId,
        public ?string $publishedRevisionId,
        public ?string $archivedAt,
        /** @var array<string, mixed>|null */
        public ?array $latestRevision,
        /** @var array<string, mixed>|null */
        public ?array $publishedRevision,
    ) {}

    public static function fromModel(Workflow $workflow): self
    {
        return new self(
            id: $workflow->uuid,
            name: $workflow->name,
            status: $workflow->status,
            latestRevisionId: $workflow->latestRevision?->uuid,
            publishedRevisionId: $workflow->publishedRevision?->uuid,
            /** @phpstan-ignore-next-line */
            archivedAt: $workflow->archived_at instanceof Carbon
                ? $workflow->archived_at->toIso8601String()
                : $workflow->archived_at,
            latestRevision: $workflow->relationLoaded('latestRevision') && $workflow->latestRevision !== null
                ? [
                    'id'              => $workflow->latestRevision->uuid,
                    'revision_number' => $workflow->latestRevision->revision_number,
                    'is_published'    => $workflow->latestRevision->is_published,
                ]
                : null,
            publishedRevision: $workflow->relationLoaded('publishedRevision') && $workflow->publishedRevision !== null
                ? [
                    'id'              => $workflow->publishedRevision->uuid,
                    'revision_number' => $workflow->publishedRevision->revision_number,
                ]
                : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'                    => $this->id,
            'name'                  => $this->name,
            'status'                => $this->status,
            'latest_revision_id'    => $this->latestRevisionId,
            'published_revision_id' => $this->publishedRevisionId,
            'archived_at'           => $this->archivedAt,
            'latest_revision'       => $this->latestRevision,
            'published_revision'    => $this->publishedRevision,
        ];
    }
}
