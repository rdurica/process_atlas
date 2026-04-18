<?php

namespace App\Http\Controllers\Api;

use App\Actions\ScreenCustomFieldActionService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpsertScreenCustomFieldRequest;
use App\Models\Screen;
use App\Models\ScreenCustomField;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScreenCustomFieldController extends Controller
{
    public function __construct(private readonly ScreenCustomFieldActionService $actions)
    {
    }

    public function upsert(UpsertScreenCustomFieldRequest $request, Screen $screen): JsonResponse
    {
        $this->authorize('update', $screen);

        $field = $this->actions->upsert($request->user(), $screen, $request->toDto());

        return response()->json(['data' => $field]);
    }

    public function destroy(Request $request, ScreenCustomField $screenCustomField): JsonResponse
    {
        $this->authorize('delete', $screenCustomField);

        $this->actions->delete($request->user(), $screenCustomField);

        return response()->json(status: 204);
    }
}
