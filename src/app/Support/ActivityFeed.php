<?php

namespace App\Support;

use App\Models\Project;
use App\Models\Screen;
use App\Models\ScreenCustomField;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Activity;

final class ActivityFeed
{
    /**
     * @return list<array<string, mixed>>
     */
    public function latestForDashboard(int $limit = 12): array
    {
        $activities = Activity::query()
            ->where('log_name', 'process_atlas')
            ->with(['causer', 'subject'])
            ->latest()
            ->limit($limit)
            ->get();

        /** @var Collection<int, Activity> $activities */
        return $this->formatActivities($activities);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function latestForWorkflow(Workflow $workflow, int $limit = 12): array
    {
        $versionIds = $workflow->versions()->pluck('id');
        $screenIds = Screen::query()->whereIn('workflow_version_id', $versionIds)->pluck('id');
        $customFieldIds = ScreenCustomField::query()->whereIn('screen_id', $screenIds)->pluck('id');

        $activities = Activity::query()
            ->where('log_name', 'process_atlas')
            ->where(function ($query) use ($workflow, $versionIds, $screenIds, $customFieldIds): void
            {
                $query->where(function ($inner) use ($workflow): void
                {
                    $inner->where('subject_type', Workflow::class)
                        ->where('subject_id', $workflow->id);
                });

                if ($versionIds->isNotEmpty())
                {
                    $query->orWhere(function ($inner) use ($versionIds): void
                    {
                        $inner->where('subject_type', WorkflowVersion::class)
                            ->whereIn('subject_id', $versionIds);
                    });
                }

                if ($screenIds->isNotEmpty())
                {
                    $query->orWhere(function ($inner) use ($screenIds): void
                    {
                        $inner->where('subject_type', Screen::class)
                            ->whereIn('subject_id', $screenIds);
                    });
                }

                if ($customFieldIds->isNotEmpty())
                {
                    $query->orWhere(function ($inner) use ($customFieldIds): void
                    {
                        $inner->where('subject_type', ScreenCustomField::class)
                            ->whereIn('subject_id', $customFieldIds);
                    });
                }
            })
            ->with(['causer', 'subject'])
            ->latest()
            ->limit($limit)
            ->get();

        /** @var Collection<int, Activity> $activities */
        return $this->formatActivities($activities);
    }

    /**
     * @param  Collection<int, Activity>  $activities
     * @return list<array<string, mixed>>
     */
    private function formatActivities(Collection $activities): array
    {
        return $activities
            ->map(function (Activity $activity): array
            {
                $causer = $activity->causer;

                return [
                    'id'            => $activity->id,
                    'event'         => Str::headline((string) ($activity->event ?: 'updated')),
                    'description'   => $activity->description,
                    'created_at'    => $activity->created_at?->toIso8601String(),
                    'causer_name'   => $causer instanceof User ? $causer->name : 'System',
                    'subject_label' => $this->resolveSubjectLabel($activity),
                    'subject_type'  => class_basename((string) $activity->subject_type),
                ];
            })
            ->values()
            ->all();
    }

    private function resolveSubjectLabel(Activity $activity): string
    {
        $subject = $activity->subject;

        return match ($activity->subject_type)
        {
            Project::class         => $subject instanceof Project ? $subject->name : 'Project',
            Workflow::class        => $subject instanceof Workflow ? $subject->name : 'Workflow',
            WorkflowVersion::class => $subject instanceof WorkflowVersion
                ? 'rev. ' . $subject->version_number
                : 'Workflow revision',
            Screen::class => $subject instanceof Screen
                ? ($subject->title ?: $subject->node_id)
                : 'Screen',
            ScreenCustomField::class => $subject instanceof ScreenCustomField ? $subject->key : 'Custom field',
            default                  => 'Activity',
        };
    }
}
