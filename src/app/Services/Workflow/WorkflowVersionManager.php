<?php

namespace App\Services\Workflow;

use App\Models\Screen;
use App\Models\ScreenCustomField;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use Illuminate\Support\Facades\DB;

final class WorkflowVersionManager
{
    public function createInitialVersion(Workflow $workflow, User $actor): WorkflowVersion
    {
        return DB::transaction(function () use ($workflow, $actor): WorkflowVersion {
            $version = $workflow->versions()->create([
                'created_by' => $actor->id,
                'version_number' => 1,
                'is_published' => false,
                'graph_json' => ['nodes' => [], 'edges' => []],
                'lock_version' => 0,
            ]);

            $workflow->update([
                'latest_version_id' => $version->id,
                'status' => 'draft',
            ]);

            return $version;
        });
    }

    public function createDraftFromLatest(Workflow $workflow, User $actor): WorkflowVersion
    {
        $source = $workflow
            ->latestVersion()
            ->with(['screens.customFields'])
            ->first();

        if (! $source) {
            return $this->createInitialVersion($workflow, $actor);
        }

        return DB::transaction(function () use ($workflow, $source, $actor): WorkflowVersion {
            $nextVersionNumber = ((int) $workflow->versions()->max('version_number')) + 1;

            $newVersion = $workflow->versions()->create([
                'created_by' => $actor->id,
                'version_number' => $nextVersionNumber,
                'is_published' => false,
                'graph_json' => $source->graph_json,
                'lock_version' => 0,
            ]);

            $this->cloneScreens($source, $newVersion);

            $workflow->update([
                'latest_version_id' => $newVersion->id,
                'status' => 'draft',
            ]);

            return $newVersion;
        });
    }

    public function publishVersion(WorkflowVersion $version): void
    {
        DB::transaction(function () use ($version): void {
            $workflow = $version->workflow()->lockForUpdate()->firstOrFail();

            $workflow->versions()->update(['is_published' => false]);
            $version->update(['is_published' => true]);

            $workflow->update([
                'published_version_id' => $version->id,
                'latest_version_id' => $version->id,
                'status' => 'published',
            ]);
        });
    }

    public function rollbackToVersion(Workflow $workflow, WorkflowVersion $target, User $actor): WorkflowVersion
    {
        abort_unless($target->workflow_id === $workflow->id, 422, 'Target revision does not belong to this workflow.');

        $target->loadMissing(['screens.customFields']);

        return DB::transaction(function () use ($workflow, $target, $actor): WorkflowVersion {
            $nextVersionNumber = ((int) $workflow->versions()->max('version_number')) + 1;

            $newVersion = $workflow->versions()->create([
                'created_by' => $actor->id,
                'version_number' => $nextVersionNumber,
                'is_published' => false,
                'graph_json' => $target->graph_json,
                'lock_version' => 0,
                'rollback_from_version_id' => $target->id,
            ]);

            $this->cloneScreens($target, $newVersion);

            $workflow->update([
                'latest_version_id' => $newVersion->id,
                'status' => 'draft',
            ]);

            return $newVersion;
        });
    }

    public function deleteVersion(Workflow $workflow, WorkflowVersion $version): void
    {
        abort_if($version->is_published, 422, 'Cannot delete a published revision.');
        abort_if($workflow->versions()->count() <= 1, 422, 'Cannot delete the only remaining revision.');

        DB::transaction(function () use ($workflow, $version): void {
            $isLatest = $workflow->latest_version_id === $version->id;

            $version->delete();

            if ($isLatest) {
                $newLatest = $workflow->versions()->orderByDesc('version_number')->firstOrFail();
                $workflow->update([
                    'latest_version_id' => $newLatest->id,
                    'status' => $newLatest->is_published ? 'published' : 'draft',
                ]);
            }
        });
    }

    private function cloneScreens(WorkflowVersion $sourceVersion, WorkflowVersion $newVersion): void
    {
        foreach ($sourceVersion->screens as $sourceScreen) {
            $newScreen = Screen::query()->create([
                'workflow_version_id' => $newVersion->id,
                'node_id' => $sourceScreen->node_id,
                'title' => $sourceScreen->title,
                'subtitle' => $sourceScreen->subtitle,
                'description' => $sourceScreen->description,
                'created_by' => $sourceScreen->created_by,
                'updated_by' => $sourceScreen->updated_by,
            ]);

            foreach ($sourceScreen->customFields as $customField) {
                ScreenCustomField::query()->create([
                    'screen_id' => $newScreen->id,
                    'key' => $customField->key,
                    'field_type' => $customField->field_type,
                    'value' => $customField->value,
                    'sort_order' => $customField->sort_order,
                ]);
            }
        }
    }
}
