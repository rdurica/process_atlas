<?php

use App\Exceptions\DomainException;
use App\Exceptions\NotFoundException;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

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

            if ($e instanceof ValidationException)
            {
                return response()->json([
                    'message' => $e->getMessage(),
                    'errors'  => $e->errors(),
                ], $e->status);
            }

            if ($e instanceof AuthenticationException)
            {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            if ($e instanceof AuthorizationException)
            {
                return response()->json([
                    'message' => 'Forbidden.',
                ], 403);
            }

            if ($e instanceof ModelNotFoundException)
            {
                return response()->json([
                    'message' => 'Not found.',
                ], 404);
            }

            if ($e instanceof HttpExceptionInterface)
            {
                $statusCode = $e->getStatusCode();
                $message = $e->getMessage() !== ''
                    ? $e->getMessage()
                    : (Response::$statusTexts[$statusCode] ?? 'Error.');

                return response()->json([
                    'message' => $statusCode >= 500 ? 'Server error.' : $message,
                ], $statusCode);
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
                ], 422);
            }

            return response()->json([
                'message' => 'Server error.',
            ], 500);
        });
    })->create();
