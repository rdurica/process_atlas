<?php

namespace App\Actions;

use App\DTO\Command\UpsertScreenCustomFieldCommand;
use App\Models\Screen;
use App\Models\ScreenCustomField;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class ScreenCustomFieldActionService
{
    public function upsert(User $actor, Screen $screen, UpsertScreenCustomFieldCommand $command): ScreenCustomField
    {
        $screen->loadMissing('workflowVersion');
        abort_if($screen->workflowVersion->is_published, 422, 'Cannot modify a published revision.');

        $field = $screen->customFields()->updateOrCreate(
            ['key' => $command->key],
            [
                'field_type' => $command->fieldType ?? 'text',
                'value' => $command->value,
                'sort_order' => $command->hasSortOrder
                    ? $command->sortOrder
                    : (((int) $screen->customFields()->max('sort_order')) + 1),
            ]
        );

        AuditLogger::log($actor, $field, 'updated', 'Screen custom field upserted');

        return $field;
    }

    public function delete(User $actor, ScreenCustomField $screenCustomField): void
    {
        $screenCustomField->loadMissing('screen.workflowVersion');
        abort_if($screenCustomField->screen->workflowVersion->is_published, 422, 'Cannot modify a published revision.');

        $screenCustomField->delete();

        AuditLogger::log($actor, $screenCustomField, 'deleted', 'Screen custom field deleted');
    }
}
