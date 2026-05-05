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
    public function createInitialRevision(Workflow $workflow, User $actor, ?string $draftName = null): WorkflowRevision
    {
        $workflow = $this->lockWorkflow($workflow);

        $revision = $workflow->revisions()->create([
            'created_by'      => $actor->id,
            'revision_number' => null,
            'draft_name'      => $draftName ?? $this->generateDraftName($workflow),
            'is_published'    => false,
            'is_locked'       => false,
            'graph_json'      => ['nodes' => [], 'edges' => []],
            'lock_version'    => 0,
        ]);

        $workflow->update([
            'latest_revision_id' => $revision->id,
            'status'             => 'draft',
        ]);

        return $revision;
    }

    public function createDraftFromSource(Workflow $workflow, User $actor, ?string $draftName = null, ?string $sourceRevisionId = null): WorkflowRevision
    {
        $workflow = $this->lockWorkflow($workflow);

        if ($sourceRevisionId !== null)
        {
            $source = $workflow
                ->revisions()
                ->with(['screens.customFields'])
                ->where('uuid', $sourceRevisionId)
                ->first();

            abort_if($source === null, 422, 'Source revision does not belong to this workflow.');
        }
        else
        {
            $source = $workflow
                ->latestRevision()
                ->with(['screens.customFields'])
                ->first();
        }

        if (! $source)
        {
            return $this->createInitialRevision($workflow, $actor, $draftName);
        }

        $newRevision = $workflow->revisions()->create([
            'created_by'         => $actor->id,
            'revision_number'    => null,
            'draft_name'         => $draftName ?? $this->generateDraftName($workflow),
            'is_published'       => false,
            'is_locked'          => false,
            'graph_json'         => $source->graph_json,
            'lock_version'       => 0,
            'source_revision_id' => $source->source_revision_id ?? $source->id,
        ]);

        $this->cloneScreens($source, $newRevision);

        $workflow->update([
            'latest_revision_id' => $newRevision->id,
            'status'             => 'draft',
        ]);

        return $newRevision;
    }

    public function publishRevision(WorkflowRevision $revision, bool $force = false): Workflow
    {
        $workflow = $revision->workflow()->lockForUpdate()->firstOrFail();
        $revision = $workflow->revisions()->whereKey($revision->id)->firstOrFail();

        if (! $force
            && $workflow->published_revision_id !== null
            && $revision->source_revision_id !== $workflow->published_revision_id)
        {
            abort(422, 'This draft does not originate from the latest published revision.');
        }

        $revisionNumber = $revision->revision_number;
        if ($revisionNumber === null)
        {
            $revisionNumber = ((int) $workflow->revisions()->max('revision_number')) + 1;
        }

        $revision->update([
            'is_published'       => true,
            'is_locked'          => true,
            'revision_number'    => $revisionNumber,
            'draft_name'         => null,
            'source_revision_id' => null,
        ]);

        $workflow->update([
            'published_revision_id' => $revision->id,
            'latest_revision_id'    => $revision->id,
            'status'                => 'published',
        ]);

        return $workflow;
    }

    public function deleteRevision(Workflow $workflow, WorkflowRevision $revision): Workflow
    {
        $workflow = $this->lockWorkflow($workflow);
        $revision = $workflow->revisions()->whereKey($revision->id)->firstOrFail();

        abort_if($revision->is_locked, 422, 'Cannot delete a locked revision.');
        abort_if($workflow->revisions()->count() <= 1, 422, 'Cannot delete the only remaining revision.');

        $isLatest = $workflow->latest_revision_id === $revision->id;

        $revision->delete();

        if ($isLatest)
        {
            $newLatest = $workflow->revisions()
                ->orderByRaw('revision_number IS NULL, revision_number DESC, created_at DESC')
                ->firstOrFail();
            $workflow->update([
                'latest_revision_id' => $newLatest->id,
                'status'             => $newLatest->is_published ? 'published' : 'draft',
            ]);
        }

        return $workflow;
    }

    public function renameDraft(WorkflowRevision $revision, string $name): void
    {
        abort_if($revision->is_published, 422, 'Cannot rename a published revision.');

        $revision->update(['draft_name' => $name]);
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
                'note'                 => $sourceScreen->note,
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

    private function generateDraftName(Workflow $workflow): string
    {
        $drafts = $workflow->revisions()
            ->whereNull('revision_number')
            ->whereNotNull('draft_name')
            ->pluck('draft_name');

        $maxNumber = 0;
        foreach ($drafts as $name)
        {
            if (preg_match('/^Draft#(\d+)$/', $name, $matches))
            {
                $maxNumber = max($maxNumber, (int) $matches[1]);
            }
        }

        return 'Draft#' . ($maxNumber + 1);
    }

    private function lockWorkflow(Workflow $workflow): Workflow
    {
        return Workflow::query()->whereKey($workflow->id)->lockForUpdate()->firstOrFail();
    }
}
