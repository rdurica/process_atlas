<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\ScreenCustomField;
use App\Models\User;
use App\Services\ProjectAccessService;

final class ScreenCustomFieldPolicy
{
    public function __construct(private readonly ProjectAccessService $access) {}

    public function delete(User $user, ScreenCustomField $screenCustomField): bool
    {
        $screenCustomField->loadMissing('screen.workflowRevision.workflow.project');

        $project = $screenCustomField->screen?->workflowRevision?->workflow?->project;
        if (! $project instanceof Project)
        {
            return false;
        }

        return $this->access->canEdit($user, $project);
    }
}
