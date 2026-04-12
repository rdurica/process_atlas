<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\EnsuresPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpsertScreenCustomFieldRequest;
use App\Models\Screen;
use App\Models\ScreenCustomField;
use App\Services\Audit\AuditLogger;
use App\Support\PermissionList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScreenCustomFieldController extends Controller
{
    use EnsuresPermission;

    public function upsert(UpsertScreenCustomFieldRequest $request, Screen $screen): JsonResponse
    {
        $this->ensurePermission($request->user(), PermissionList::WORKFLOWS_EDIT);

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
        $this->ensurePermission($request->user(), PermissionList::WORKFLOWS_EDIT);

        $screenCustomField->delete();

        AuditLogger::log($request->user(), $screenCustomField, 'deleted', 'Screen custom field deleted');

        return response()->json(status: 204);
    }
}
