<?php

namespace App\DTO\Result;

final readonly class WorkflowGraphUpdateResult
{
    public function __construct(
        public int $workflowVersionId,
        public int $lockVersion,
    ) {
    }

    /**
     * @return array{workflow_version_id: int, lock_version: int}
     */
    public function toApiArray(): array
    {
        return [
            'workflow_version_id' => $this->workflowVersionId,
            'lock_version' => $this->lockVersion,
        ];
    }

    /**
     * @return array{workflow_revision_id: int, lock_revision: int}
     */
    public function toMcpArray(): array
    {
        return [
            'workflow_revision_id' => $this->workflowVersionId,
            'lock_revision' => $this->lockVersion,
        ];
    }
}
