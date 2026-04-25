<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\Models\User;
use App\Services\Audit\AuditLogger;

final class DeleteUserCommand
{
    public function execute(User $actor, User $user): void
    {
        abort_if($actor->id === $user->id, 422, 'Cannot delete yourself.');

        AuditLogger::log($actor, $user, 'deleted', 'User deleted');

        $user->delete();
    }
}
