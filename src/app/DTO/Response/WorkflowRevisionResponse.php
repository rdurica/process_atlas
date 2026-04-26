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
        public int $revisionNumber,
        public bool $isPublished,
        public bool $isLocked,
        public ?int $rollbackFromRevisionId,
        public ?string $createdAt,
    ) {}

    public static function fromModel(WorkflowRevision $revision): self
    {
        return new self(
            id: $revision->id,
            workflowId: $revision->workflow_id,
            revisionNumber: $revision->revision_number,
            isPublished: $revision->is_published,
            isLocked: $revision->is_locked ?? false,
            rollbackFromRevisionId: $revision->rollback_from_revision_id,
            createdAt: $revision->created_at?->toIso8601String(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'                        => $this->id,
            'workflow_id'               => $this->workflowId,
            'revision_number'           => $this->revisionNumber,
            'is_published'              => $this->isPublished,
            'is_locked'                 => $this->isLocked,
            'rollback_from_revision_id' => $this->rollbackFromRevisionId,
            'created_at'                => $this->createdAt,
        ];
    }
}
