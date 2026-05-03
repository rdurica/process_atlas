<?php

namespace App\Http\Middleware;

use App\Models\Project;
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

        if ($user)
        {
            $permissions = $user->getAllPermissions()->pluck('name');
            $permissions->push('projects.view', 'workflows.view');

            if ($user->can(PermissionList::PROJECTS_CREATE))
            {
                $permissions->push('projects.create');
            }

            if ($user->can(PermissionList::MCP_USE))
            {
                $permissions->push('mcp.use');
            }
        }

        $projects = [];
        if ($user)
        {
            $isAdmin = $user->can(PermissionList::PROJECTS_ADMIN);
            $projects = Project::query()
                ->when(
                    ! $isAdmin,
                    fn ($query) => $query->where(function ($q) use ($user): void
                    {
                        $q->where('is_public', true)
                            ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
                    }),
                )
                ->notArchived()
                ->orderBy('name')
                ->get()
                ->map(function (Project $project) use ($user, $isAdmin)
                {
                    $currentUserRole = $isAdmin
                        ? 'process_owner'
                        : $user->projectRoleIn($project);

                    // If user is not an explicit member but project is public, show as viewer
                    if ($currentUserRole === null && $project->isPublic())
                    {
                        $currentUserRole = 'viewer';
                    }

                    return [
                        'id'                => $project->id,
                        'name'              => $project->name,
                        'description'       => $project->description,
                        'current_user_role' => $currentUserRole,
                    ];
                })
                ->values()
                ->all();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    ...$user->only(['id', 'name', 'email', 'email_verified_at']),
                    'roles'       => $user->getRoleNames()->values(),
                    'permissions' => $permissions->unique()->values(),
                    'is_admin'    => $user->isAdmin(),
                ] : null,
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'projects' => $projects,
        ];
    }
}
