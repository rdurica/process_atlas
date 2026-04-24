<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\UpdateScreenRequest;
use App\DTO\Response\ScreenResponse;
use App\Models\Screen;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class UpdateScreenCommand
{
    public function execute(User $actor, Screen $screen, UpdateScreenRequest $request): ScreenResponse
    {
        $screen->loadMissing('workflowVersion');
        abort_if($screen->workflowVersion->is_published, 422, 'Cannot modify a published revision.');

        $screen->update([
            ...$request->toArray(),
            'updated_by' => $actor->id,
        ]);

        AuditLogger::log($actor, $screen, 'updated', 'Screen updated');

        return ScreenResponse::fromModel($screen->fresh(['customFields']));
    }
}
