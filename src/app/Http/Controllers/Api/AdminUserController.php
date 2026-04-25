<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('admin');

        $users = User::query()
            ->with('roles')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user): array => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'roles'      => $user->roles->pluck('name'),
                'is_active'  => $user->is_active,
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('admin');

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            'roles'    => ['nullable', 'array'],
            'roles.*'  => ['string', Rule::in(['admin', 'process_owner', 'editor', 'viewer'])],
        ]);

        $user = User::query()->create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => bcrypt($validated['password']),
        ]);

        if (! empty($validated['roles']))
        {
            $user->syncRoles($validated['roles']);
        }

        return response()->json(['data' => [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'roles' => $user->roles->pluck('name'),
        ]], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('admin');

        $validated = $request->validate([
            'name'  => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($validated);

        return response()->json(['data' => [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'roles' => $user->roles->pluck('name'),
        ]]);
    }

    public function updateRoles(Request $request, User $user): JsonResponse
    {
        $this->authorize('admin');

        $validated = $request->validate([
            'roles'   => ['required', 'array'],
            'roles.*' => ['string', Rule::in(['admin', 'process_owner', 'editor', 'viewer'])],
        ]);

        $user->syncRoles($validated['roles']);

        return response()->json(['data' => [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'roles' => $user->roles->pluck('name'),
        ]]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('admin');

        abort_if($user->id === $request->user()?->id, 422, 'Cannot delete yourself.');

        $user->delete();

        return response()->json(null, 204);
    }

    public function toggleActive(Request $request, User $user): JsonResponse
    {
        $this->authorize('admin');

        abort_if($user->id === $request->user()?->id, 422, 'Cannot disable yourself.');

        $user->update(['is_active' => ! $user->is_active]);

        return response()->json(['data' => [
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'roles'     => $user->roles->pluck('name'),
            'is_active' => $user->is_active,
        ]]);
    }
}
