<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\UpdateUserRolesRequest;
use App\DTO\Response\UserResponse;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class UpdateUserRolesCommand
{
    public function execute(User $actor, User $user, UpdateUserRolesRequest $request): UserResponse
    {
        $user->syncRoles($request->roles);

        AuditLogger::log($actor, $user, 'updated', 'User roles updated');

        return UserResponse::fromModel($user->load('roles'));
    }
}
