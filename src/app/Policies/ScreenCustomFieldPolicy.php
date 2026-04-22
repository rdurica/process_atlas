<?php

namespace App\Policies;

use App\Models\ScreenCustomField;
use App\Models\User;
use App\Services\ProjectAccessService;

final class ScreenCustomFieldPolicy
{
    public function __construct(private readonly ProjectAccessService $access) {}

    public function delete(User $user, ScreenCustomField $screenCustomField): bool
    {
        $screenCustomField->loadMissing('screen.workflowVersion.workflow.project');

        return $this->access->canEdit($user, $screenCustomField->screen->workflowVersion->workflow->project);
    }
}
