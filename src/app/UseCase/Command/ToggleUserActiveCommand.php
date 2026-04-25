<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Response\UserResponse;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class ToggleUserActiveCommand
{
    public function execute(User $actor, User $user): UserResponse
    {
        abort_if($actor->id === $user->id, 422, 'Cannot disable yourself.');

        $user->update(['is_active' => ! $user->is_active]);

        AuditLogger::log($actor, $user, 'updated', 'User active status toggled');

        return UserResponse::fromModel($user->load('roles'));
    }
}
