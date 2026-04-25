<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    use AuthorizesRequests;

    protected function user(): User
    {
        $user = auth()->user();
        abort_if(! $user instanceof User, 401);

        return $user;
    }
}
