<?php

namespace App\UseCase\Query;

use App\Models\WorkflowRevision;

final class WorkflowRevisionQueryService
{
    public function findForUpsert(int $workflowRevisionId): WorkflowRevision
    {
        return WorkflowRevision::query()
            ->with('workflow.project')
            ->findOrFail($workflowRevisionId);
    }

    public function detailForApi(WorkflowRevision $workflowRevision): WorkflowRevision
    {
        return $workflowRevision->load(['screens.customFields', 'workflow']);
    }
}
