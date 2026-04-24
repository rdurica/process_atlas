<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Models\WorkflowVersion;
use JsonSerializable;

final readonly class WorkflowVersionResponse implements JsonSerializable
{
    public function __construct(
        public int $id,
        public int $workflowId,
        public int $versionNumber,
        public bool $isPublished,
        public ?int $rollbackFromVersionId,
        public ?string $createdAt,
    ) {}

    public static function fromModel(WorkflowVersion $version): self
    {
        return new self(
            id: $version->id,
            workflowId: $version->workflow_id,
            versionNumber: $version->version_number,
            isPublished: $version->is_published,
            rollbackFromVersionId: $version->rollback_from_version_id,
            createdAt: $version->created_at?->toIso8601String(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'                       => $this->id,
            'workflow_id'              => $this->workflowId,
            'version_number'           => $this->versionNumber,
            'is_published'             => $this->isPublished,
            'rollback_from_version_id' => $this->rollbackFromVersionId,
            'created_at'               => $this->createdAt,
        ];
    }
}
