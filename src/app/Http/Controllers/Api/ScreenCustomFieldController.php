<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpsertScreenCustomFieldRequest;
use App\Models\Screen;
use App\Models\ScreenCustomField;
use App\UseCase\Command\DeleteScreenCustomFieldCommand;
use App\UseCase\Command\UpsertScreenCustomFieldCommand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScreenCustomFieldController extends Controller
{
    public function __construct(
        private readonly UpsertScreenCustomFieldCommand $upsertField,
        private readonly DeleteScreenCustomFieldCommand $deleteField,
    ) {}

    public function upsert(UpsertScreenCustomFieldRequest $request, Screen $screen): JsonResponse
    {
        $this->authorize('update', $screen);

        $response = $this->upsertField->execute($this->user(), $screen, $request->toDto());

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function destroy(Request $request, ScreenCustomField $screenCustomField): JsonResponse
    {
        $this->authorize('delete', $screenCustomField);

        $this->deleteField->execute($this->user(), $screenCustomField);

        return response()->json(status: 204);
    }
}
