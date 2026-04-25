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
        public ?int $latestRevisionId,
        public ?int $publishedRevisionId,
        public ?string $archivedAt,
        /** @var array<string, mixed>|null */
        public ?array $latestRevision,
        /** @var array<string, mixed>|null */
        public ?array $publishedRevision,
    ) {}

    public static function fromModel(Workflow $workflow): self
    {
        return new self(
            id: $workflow->id,
            name: $workflow->name,
            status: $workflow->status,
            latestRevisionId: $workflow->latest_revision_id,
            publishedRevisionId: $workflow->published_revision_id,
            /** @phpstan-ignore-next-line */
            archivedAt: $workflow->archived_at instanceof Carbon
                ? $workflow->archived_at->toIso8601String()
                : $workflow->archived_at,
            latestRevision: $workflow->relationLoaded('latestRevision') && $workflow->latestRevision !== null
                ? $workflow->latestRevision->toArray()
                : null,
            publishedRevision: $workflow->relationLoaded('publishedRevision') && $workflow->publishedRevision !== null
                ? $workflow->publishedRevision->toArray()
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
