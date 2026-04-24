<?php

namespace App\UseCase\Query;

use App\Models\WorkflowVersion;

final class WorkflowVersionQueryService
{
    public function findForUpsert(int $workflowVersionId): WorkflowVersion
    {
        return WorkflowVersion::query()
            ->with('workflow.project')
            ->findOrFail($workflowVersionId);
    }

    public function detailForApi(WorkflowVersion $workflowVersion): WorkflowVersion
    {
        return $workflowVersion->load(['screens.customFields', 'workflow']);
    }
}
