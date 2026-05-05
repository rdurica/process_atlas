<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($this->user()->hasVerifiedEmail())
        {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        $this->user()->sendEmailVerificationNotification();

        return back()->with('status', 'A new verification link has been sent to the email address you provided during registration.');
    }
}
