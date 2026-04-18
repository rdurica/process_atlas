<?php

namespace App\Http\Middleware;

use App\Support\PermissionList;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $permissions = collect();

        if ($user) {
            $permissions = $user->getAllPermissions()->pluck('name');
            $permissions->push('projects.view', 'workflows.view');

            if ($user->can(PermissionList::PROJECTS_ADMIN) || $user->hasRole('process_owner')) {
                $permissions->push('projects.manage', 'workflows.edit');
            } elseif ($user->hasRole('editor')) {
                $permissions->push('workflows.edit');
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    ...$user->only(['id', 'name', 'email', 'email_verified_at']),
                    'roles' => $user->getRoleNames()->values(),
                    'permissions' => $permissions->unique()->values(),
                ] : null,
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
