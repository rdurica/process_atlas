<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Models\WorkflowRevision;
use JsonSerializable;

final readonly class WorkflowRevisionResponse implements JsonSerializable
{
    public function __construct(
        public string $id,
        public string $workflowId,
        public ?int $revisionNumber,
        public ?string $draftName,
        public bool $isPublished,
        public bool $isLocked,
        public ?string $sourceRevisionId,
        public ?string $createdAt,
    ) {}

    public static function fromModel(WorkflowRevision $revision): self
    {
        return new self(
            id: $revision->uuid,
            /** @phpstan-ignore nullsafe.neverNull */
            workflowId: $revision->workflow?->uuid ?? '',
            revisionNumber: $revision->revision_number,
            draftName: $revision->draft_name,
            isPublished: $revision->is_published,
            isLocked: $revision->is_locked ?? false,
            sourceRevisionId: $revision->sourceRevision?->uuid,
            createdAt: $revision->created_at?->toIso8601String(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'                 => $this->id,
            'workflow_id'        => $this->workflowId,
            'revision_number'    => $this->revisionNumber,
            'draft_name'         => $this->draftName,
            'is_published'       => $this->isPublished,
            'is_locked'          => $this->isLocked,
            'source_revision_id' => $this->sourceRevisionId,
            'created_at'         => $this->createdAt,
        ];
    }
}
