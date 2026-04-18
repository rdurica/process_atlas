<?php

namespace App\Actions;

use App\DTO\Command\UpdateWorkflowGraphCommand;
use App\DTO\Result\WorkflowGraphUpdateResult;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Services\Audit\AuditLogger;
use App\Services\Workflow\WorkflowVersionManager;

final class WorkflowVersionActionService
{
    public function __construct(private readonly WorkflowVersionManager $versionManager)
    {
    }

    public function createDraft(User $actor, Workflow $workflow): WorkflowVersion
    {
        $version = $this->versionManager->createDraftFromLatest($workflow, $actor);

        AuditLogger::log($actor, $version, 'created', 'Draft workflow revision created', [
            'workflow_id' => $workflow->id,
        ]);

        return $version;
    }

    public function updateGraph(
        User $actor,
        WorkflowVersion $workflowVersion,
        UpdateWorkflowGraphCommand $command,
        string $source = 'ui',
    ): WorkflowGraphUpdateResult {
        abort_if($workflowVersion->is_published, 422, 'Cannot modify a published revision.');
        abort_if($command->lockVersion !== $workflowVersion->lock_version, 409, 'Revision conflict. Reload and retry.');

        $workflowVersion->update([
            'graph_json' => $command->graphJson,
            'lock_version' => $workflowVersion->lock_version + 1,
        ]);

        AuditLogger::log($actor, $workflowVersion, 'updated', 'Workflow graph updated', source: $source);

        return new WorkflowGraphUpdateResult(
            workflowVersionId: $workflowVersion->id,
            lockVersion: $workflowVersion->lock_version,
        );
    }

    public function publish(User $actor, WorkflowVersion $workflowVersion): WorkflowVersion
    {
        $this->versionManager->publishVersion($workflowVersion);

        AuditLogger::log($actor, $workflowVersion, 'published', 'Workflow revision published', [
            'workflow_id' => $workflowVersion->workflow_id,
        ]);

        return $workflowVersion->fresh();
    }

    public function rollback(User $actor, Workflow $workflow, WorkflowVersion $target): WorkflowVersion
    {
        $newVersion = $this->versionManager->rollbackToVersion($workflow, $target, $actor);

        AuditLogger::log($actor, $newVersion, 'created', 'Rollback draft created', [
            'workflow_id' => $workflow->id,
            'source_version_id' => $target->id,
        ]);

        return $newVersion;
    }

    public function delete(User $actor, WorkflowVersion $workflowVersion): void
    {
        $workflowVersion->loadMissing('workflow');

        $versionNumber = $workflowVersion->version_number;
        $workflowId = $workflowVersion->workflow_id;

        $this->versionManager->deleteVersion($workflowVersion->workflow, $workflowVersion);

        AuditLogger::log($actor, $workflowVersion->workflow, 'deleted', 'Workflow revision deleted', [
            'version_id' => $workflowVersion->id,
            'version_number' => $versionNumber,
            'workflow_id' => $workflowId,
        ]);
    }
}
