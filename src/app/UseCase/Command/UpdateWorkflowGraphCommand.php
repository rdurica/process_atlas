<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\UpdateWorkflowGraphRequest;
use App\DTO\Response\WorkflowGraphUpdateResponse;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\User;
use App\Models\WorkflowRevision;
use App\Services\Audit\AuditLogger;
use Illuminate\Support\Facades\DB;

final class UpdateWorkflowGraphCommand
{
    public function __construct(
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(
        User $actor,
        WorkflowRevision $workflowRevision,
        UpdateWorkflowGraphRequest $request,
        string $source = 'ui',
    ): WorkflowGraphUpdateResponse {
        return $this->transactionManager->transactional(function () use ($actor, $workflowRevision, $request, $source): WorkflowGraphUpdateResponse
        {
            abort_if($workflowRevision->is_published, 422, 'Cannot modify a published revision.');

            $updated = WorkflowRevision::query()
                ->whereKey($workflowRevision->id)
                ->where('lock_version', $request->lockVersion)
                ->where('is_published', false)
                ->update([
                    'graph_json'   => $request->graphJson,
                    'lock_version' => DB::raw('lock_version + 1'),
                ]);

            abort_if($updated !== 1, 409, 'Revision conflict. Reload and retry.');

            $workflowRevision->refresh();

            AuditLogger::log($actor, $workflowRevision, 'updated', 'Workflow graph updated', source: $source);

            return new WorkflowGraphUpdateResponse(
                workflowRevisionId: $workflowRevision->id,
                lockVersion: $workflowRevision->lock_version,
            );
        });
    }
}
