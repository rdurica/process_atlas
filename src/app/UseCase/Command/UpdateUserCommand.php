<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\UpdateUserRequest;
use App\DTO\Response\UserResponse;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class UpdateUserCommand
{
    public function execute(User $actor, User $user, UpdateUserRequest $request): UserResponse
    {
        $user->update($request->toArray());

        AuditLogger::log($actor, $user, 'updated', 'User updated');

        return UserResponse::fromModel($user->load('roles'));
    }
}
