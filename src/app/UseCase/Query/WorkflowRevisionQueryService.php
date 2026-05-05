<?php

namespace App\UseCase\Query;

use App\Models\WorkflowRevision;

final class WorkflowRevisionQueryService
{
    public function findForUpsert(string $workflowRevisionId): WorkflowRevision
    {
        return WorkflowRevision::query()
            ->with('workflow.project')
            ->where('uuid', $workflowRevisionId)
            ->firstOrFail();
    }

    public function detailForApi(WorkflowRevision $workflowRevision): WorkflowRevision
    {
        return $workflowRevision->load(['screens.customFields', 'workflow']);
    }
}
