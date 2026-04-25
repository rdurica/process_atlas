<?php

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Notification;

test('reset password link screen can be rendered', function ()
{
    $response = $this->get('/forgot-password');

    $response->assertStatus(200);
});

test('reset password link can be requested', function ()
{
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class);
});

test('reset password request does not reveal unknown email addresses', function ()
{
    Notification::fake();

    $response = $this->post('/forgot-password', ['email' => 'missing@example.com']);

    $response
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', trans('passwords.sent'));

    Notification::assertNothingSent();
});

test('reset password request is rate limited', function ()
{
    Notification::fake();

    for ($attempt = 0; $attempt < 5; $attempt++)
    {
        $this->post('/forgot-password', ['email' => 'rate-limited@example.com']);
    }

    $this->post('/forgot-password', ['email' => 'rate-limited@example.com'])
        ->assertTooManyRequests();
});

test('reset password screen can be rendered', function ()
{
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification)
    {
        $response = $this->get('/reset-password/' . $notification->token);

        $response->assertStatus(200);

        return true;
    });
});

test('password can be reset with valid token', function ()
{
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification) use ($user)
    {
        $response = $this->post('/reset-password', [
            'token'                 => $notification->token,
            'email'                 => $user->email,
            'password'              => 'password',
            'password_confirmation' => 'password',
        ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('login'));

        return true;
    });
});
