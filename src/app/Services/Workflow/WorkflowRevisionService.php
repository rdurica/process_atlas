<?php

declare(strict_types=1);

namespace App\Services\Workflow;

use App\Models\Screen;
use App\Models\ScreenCustomField;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowRevision;

final class WorkflowRevisionService
{
    public function createInitialRevision(Workflow $workflow, User $actor): WorkflowRevision
    {
        $workflow = $this->lockWorkflow($workflow);

        $revision = $workflow->revisions()->create([
            'created_by'      => $actor->id,
            'revision_number' => 1,
            'is_published'    => false,
            'graph_json'      => ['nodes' => [], 'edges' => []],
            'lock_version'    => 0,
        ]);

        $workflow->update([
            'latest_revision_id' => $revision->id,
            'status'             => 'draft',
        ]);

        return $revision;
    }

    public function createDraftFromLatest(Workflow $workflow, User $actor): WorkflowRevision
    {
        $workflow = $this->lockWorkflow($workflow);
        $source = $workflow
            ->latestRevision()
            ->with(['screens.customFields'])
            ->first();

        if (! $source)
        {
            return $this->createInitialRevision($workflow, $actor);
        }

        $nextRevisionNumber = ((int) $workflow->revisions()->max('revision_number')) + 1;

        $newRevision = $workflow->revisions()->create([
            'created_by'      => $actor->id,
            'revision_number' => $nextRevisionNumber,
            'is_published'    => false,
            'graph_json'      => $source->graph_json,
            'lock_version'    => 0,
        ]);

        $this->cloneScreens($source, $newRevision);

        $workflow->update([
            'latest_revision_id' => $newRevision->id,
            'status'             => 'draft',
        ]);

        return $newRevision;
    }

    public function publishRevision(WorkflowRevision $revision): Workflow
    {
        $workflow = $revision->workflow()->lockForUpdate()->firstOrFail();
        $revision = $workflow->revisions()->whereKey($revision->id)->firstOrFail();

        $workflow->revisions()->update(['is_published' => false]);
        $revision->update(['is_published' => true]);

        $workflow->update([
            'published_revision_id' => $revision->id,
            'latest_revision_id'    => $revision->id,
            'status'                => 'published',
        ]);

        return $workflow;
    }

    public function rollbackToRevision(Workflow $workflow, WorkflowRevision $target, User $actor): WorkflowRevision
    {
        abort_unless($target->workflow_id === $workflow->id, 422, 'Target revision does not belong to this workflow.');

        $workflow = $this->lockWorkflow($workflow);
        $target = $workflow
            ->revisions()
            ->with(['screens.customFields'])
            ->whereKey($target->id)
            ->firstOrFail();

        $nextRevisionNumber = ((int) $workflow->revisions()->max('revision_number')) + 1;

        $newRevision = $workflow->revisions()->create([
            'created_by'                => $actor->id,
            'revision_number'           => $nextRevisionNumber,
            'is_published'              => false,
            'graph_json'                => $target->graph_json,
            'lock_version'              => 0,
            'rollback_from_revision_id' => $target->id,
        ]);

        $this->cloneScreens($target, $newRevision);

        $workflow->update([
            'latest_revision_id' => $newRevision->id,
            'status'             => 'draft',
        ]);

        return $newRevision;
    }

    public function deleteRevision(Workflow $workflow, WorkflowRevision $revision): Workflow
    {
        $workflow = $this->lockWorkflow($workflow);
        $revision = $workflow->revisions()->whereKey($revision->id)->firstOrFail();

        abort_if($revision->is_published, 422, 'Cannot delete a published revision.');
        abort_if($workflow->revisions()->count() <= 1, 422, 'Cannot delete the only remaining revision.');

        $isLatest = $workflow->latest_revision_id === $revision->id;

        $revision->delete();

        if ($isLatest)
        {
            $newLatest = $workflow->revisions()->orderByDesc('revision_number')->firstOrFail();
            $workflow->update([
                'latest_revision_id' => $newLatest->id,
                'status'             => $newLatest->is_published ? 'published' : 'draft',
            ]);
        }

        return $workflow;
    }

    private function cloneScreens(WorkflowRevision $sourceRevision, WorkflowRevision $newRevision): void
    {
        foreach ($sourceRevision->screens as $sourceScreen)
        {
            $newScreen = Screen::query()->create([
                'workflow_revision_id' => $newRevision->id,
                'node_id'              => $sourceScreen->node_id,
                'title'                => $sourceScreen->title,
                'subtitle'             => $sourceScreen->subtitle,
                'description'          => $sourceScreen->description,
                'image_path'           => $sourceScreen->image_path,
                'created_by'           => $sourceScreen->created_by,
                'updated_by'           => $sourceScreen->updated_by,
            ]);

            foreach ($sourceScreen->customFields as $customField)
            {
                ScreenCustomField::query()->create([
                    'screen_id'  => $newScreen->id,
                    'key'        => $customField->key,
                    'field_type' => $customField->field_type,
                    'value'      => $customField->value,
                    'sort_order' => $customField->sort_order,
                ]);
            }
        }
    }

    private function lockWorkflow(Workflow $workflow): Workflow
    {
        return Workflow::query()->whereKey($workflow->id)->lockForUpdate()->firstOrFail();
    }
}
