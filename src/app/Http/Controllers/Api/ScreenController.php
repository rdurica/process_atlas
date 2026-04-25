<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateScreenRequest;
use App\Http\Requests\Api\UpsertScreenRequest;
use App\Models\Screen;
use App\UseCase\Command\UpdateScreenCommand;
use App\UseCase\Command\UpsertScreenCommand;
use App\UseCase\Query\ScreenQueryService;
use App\UseCase\Query\WorkflowRevisionQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScreenController extends Controller
{
    public function __construct(
        private readonly ScreenQueryService $screens,
        private readonly WorkflowRevisionQueryService $revisions,
        private readonly UpsertScreenCommand $upsertScreen,
        private readonly UpdateScreenCommand $updateScreen,
    ) {}

    public function show(Request $request, Screen $screen): JsonResponse
    {
        $this->authorize('view', $screen);

        return response()->json(['data' => $this->screens->detailForApi($screen)]);
    }

    public function upsert(UpsertScreenRequest $request): JsonResponse
    {
        $command = $request->toDto();
        $workflowRevision = $this->revisions->findForUpsert($command->workflowRevisionId);

        $this->authorize('updateGraph', $workflowRevision);

        $response = $this->upsertScreen->execute(
            $this->user(),
            $workflowRevision,
            $command,
        );

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function update(UpdateScreenRequest $request, Screen $screen): JsonResponse
    {
        $this->authorize('update', $screen);

        $response = $this->updateScreen->execute($this->user(), $screen, $request->toDto());

        return response()->json(['data' => $response->jsonSerialize()]);
    }
}
