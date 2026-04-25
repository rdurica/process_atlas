<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\UpdateScreenRequest;
use App\DTO\Response\ScreenResponse;
use App\Exceptions\ConsistencyException;
use App\Exceptions\ScreenNotFoundException;
use App\Models\Screen;
use App\Models\User;
use App\Models\WorkflowRevision;
use App\Services\Audit\AuditLogger;

final class UpdateScreenCommand
{
    public function execute(User $actor, Screen $screen, UpdateScreenRequest $request): ScreenResponse
    {
        $screen->loadMissing('workflowRevision');
        $workflowRevision = $screen->workflowRevision;
        if (! $workflowRevision instanceof WorkflowRevision)
        {
            throw new ConsistencyException('Screen is missing a workflow revision.');
        }
        abort_if($workflowRevision->is_published, 422, 'Cannot modify a published revision.');

        $screen->update([
            ...$request->toArray(),
            'updated_by' => $actor->id,
        ]);

        AuditLogger::log($actor, $screen, 'updated', 'Screen updated');

        $fresh = $screen->fresh(['customFields']);
        if (! $fresh instanceof Screen)
        {
            throw new ScreenNotFoundException('Screen not found after update.');
        }

        return ScreenResponse::fromModel($fresh);
    }
}
