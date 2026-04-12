<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\User;

trait EnsuresPermission
{
    private function ensurePermission(User $user, string $permission): void
    {
        abort_unless($user->can($permission), 403, 'Forbidden.');
    }
}
