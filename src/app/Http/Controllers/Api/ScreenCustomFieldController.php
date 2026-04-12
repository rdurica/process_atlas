<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpsertScreenCustomFieldRequest;
use App\Models\Screen;
use App\Models\ScreenCustomField;
use App\Services\Audit\AuditLogger;
use App\Services\ProjectAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScreenCustomFieldController extends Controller
{
    public function __construct(private readonly ProjectAccessService $access)
    {
    }

    public function upsert(UpsertScreenCustomFieldRequest $request, Screen $screen): JsonResponse
    {
        $screen->loadMissing('workflowVersion.workflow.project');
        abort_unless($this->access->canEdit($request->user(), $screen->workflowVersion->workflow->project), 403, 'Forbidden.');
        abort_if($screen->workflowVersion->is_published, 422, 'Cannot modify a published version.');

        $validated = $request->validated();

        $field = $screen->customFields()->updateOrCreate(
            ['key' => $validated['key']],
            [
                'field_type' => $validated['field_type'] ?? 'text',
                'value' => $validated['value'] ?? null,
                'sort_order' => $validated['sort_order'] ?? (((int) $screen->customFields()->max('sort_order')) + 1),
            ]
        );

        AuditLogger::log($request->user(), $field, 'updated', 'Screen custom field upserted');

        return response()->json(['data' => $field]);
    }

    public function destroy(Request $request, ScreenCustomField $screenCustomField): JsonResponse
    {
        $screenCustomField->loadMissing('screen.workflowVersion.workflow.project');
        abort_unless($this->access->canEdit($request->user(), $screenCustomField->screen->workflowVersion->workflow->project), 403, 'Forbidden.');
        abort_if($screenCustomField->screen->workflowVersion->is_published, 422, 'Cannot modify a published version.');

        $screenCustomField->delete();

        AuditLogger::log($request->user(), $screenCustomField, 'deleted', 'Screen custom field deleted');

        return response()->json(status: 204);
    }
}
