<?php

namespace App\DTO\Response;

final readonly class WorkflowGraphUpdateResponse
{
    public function __construct(
        public string $workflowRevisionId,
        public int $lockVersion,
    ) {}

    /**
     * @return array{workflow_revision_id: string, lock_version: int}
     */
    public function toApiArray(): array
    {
        return [
            'workflow_revision_id' => $this->workflowRevisionId,
            'lock_version'         => $this->lockVersion,
        ];
    }

    /**
     * @return array{workflow_revision_id: string, lock_revision: int}
     */
    public function toMcpArray(): array
    {
        return [
            'workflow_revision_id' => $this->workflowRevisionId,
            'lock_revision'        => $this->lockVersion,
        ];
    }
}
