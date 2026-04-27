<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Models\WorkflowRevision;
use JsonSerializable;

final readonly class WorkflowRevisionResponse implements JsonSerializable
{
    public function __construct(
        public int $id,
        public int $workflowId,
        public ?int $revisionNumber,
        public ?string $draftName,
        public bool $isPublished,
        public bool $isLocked,
        public ?int $sourceRevisionId,
        public ?string $createdAt,
    ) {}

    public static function fromModel(WorkflowRevision $revision): self
    {
        return new self(
            id: $revision->id,
            workflowId: $revision->workflow_id,
            revisionNumber: $revision->revision_number,
            draftName: $revision->draft_name,
            isPublished: $revision->is_published,
            isLocked: $revision->is_locked ?? false,
            sourceRevisionId: $revision->source_revision_id,
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
