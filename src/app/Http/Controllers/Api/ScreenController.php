<?php

namespace App\Http\Controllers\Api;

use App\Actions\ScreenActionService;
use App\DTO\Command\UpdateScreenCommand;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpsertScreenRequest;
use App\Models\Screen;
use App\Queries\ScreenQueryService;
use App\Queries\WorkflowVersionQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScreenController extends Controller
{
    public function __construct(
        private readonly ScreenQueryService $screens,
        private readonly WorkflowVersionQueryService $versions,
        private readonly ScreenActionService $actions,
    ) {
    }

    public function show(Request $request, Screen $screen): JsonResponse
    {
        $this->authorize('view', $screen);

        return response()->json(['data' => $this->screens->detailForApi($screen)]);
    }

    public function upsert(UpsertScreenRequest $request): JsonResponse
    {
        $command = $request->toDto();
        $workflowVersion = $this->versions->findForUpsert($command->workflowVersionId);

        $this->authorize('updateGraph', $workflowVersion);

        $screen = $this->actions->upsert(
            $request->user(),
            $workflowVersion,
            $command,
        );

        return response()->json(['data' => $screen]);
    }

    public function update(Request $request, Screen $screen): JsonResponse
    {
        $this->authorize('update', $screen);

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        return response()->json([
            'data' => $this->actions->update($request->user(), $screen, UpdateScreenCommand::fromArray($data)),
        ]);
    }
}
