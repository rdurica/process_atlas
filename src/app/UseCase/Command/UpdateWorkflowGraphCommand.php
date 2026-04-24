<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\UpdateWorkflowGraphRequest;
use App\DTO\Response\WorkflowGraphUpdateResponse;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\User;
use App\Models\WorkflowVersion;
use App\Services\Audit\AuditLogger;
use Illuminate\Support\Facades\DB;

final class UpdateWorkflowGraphCommand
{
    public function __construct(
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(
        User $actor,
        WorkflowVersion $workflowVersion,
        UpdateWorkflowGraphRequest $request,
        string $source = 'ui',
    ): WorkflowGraphUpdateResponse {
        return $this->transactionManager->transactional(function () use ($actor, $workflowVersion, $request, $source): WorkflowGraphUpdateResponse
        {
            abort_if($workflowVersion->is_published, 422, 'Cannot modify a published revision.');

            $updated = WorkflowVersion::query()
                ->whereKey($workflowVersion->id)
                ->where('lock_version', $request->lockVersion)
                ->where('is_published', false)
                ->update([
                    'graph_json'   => $request->graphJson,
                    'lock_version' => DB::raw('lock_version + 1'),
                ]);

            abort_if($updated !== 1, 409, 'Revision conflict. Reload and retry.');

            $workflowVersion->refresh();

            AuditLogger::log($actor, $workflowVersion, 'updated', 'Workflow graph updated', source: $source);

            return new WorkflowGraphUpdateResponse(
                workflowVersionId: $workflowVersion->id,
                lockVersion: $workflowVersion->lock_version,
            );
        });
    }
}
