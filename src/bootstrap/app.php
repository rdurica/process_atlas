<?php

use App\Exceptions\DomainException;
use App\Exceptions\NotFoundException;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void
    {
        $middleware->statefulApi();

        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            EnsureUserIsActive::class,
        ]);

        $middleware->api(append: [
            EnsureUserIsActive::class,
        ]);

        $middleware->alias([
            'ability'            => CheckForAnyAbility::class,
            'role'               => RoleMiddleware::class,
            'permission'         => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void
    {
        $exceptions->renderable(function (Throwable $e, Request $request): ?Response
        {
            if (! $request->is('api/*') || config('app.debug'))
            {
                return null;
            }

            if ($e instanceof NotFoundException)
            {
                return response()->json([
                    'message' => $e->getMessage(),
                ], 404);
            }

            if ($e instanceof DomainException)
            {
                return response()->json([
                    'message' => $e->getMessage(),
                ], 500);
            }

            return response()->json([
                'message' => 'Server error.',
            ], 500);
        });
    })->create();
