<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreUserRequest;
use App\Http\Requests\Api\UpdateUserRequest;
use App\Http\Requests\Api\UpdateUserRolesRequest;
use App\Models\User;
use App\UseCase\Command\CreateUserCommand;
use App\UseCase\Command\DeleteUserCommand;
use App\UseCase\Command\ToggleUserActiveCommand;
use App\UseCase\Command\UpdateUserCommand;
use App\UseCase\Command\UpdateUserRolesCommand;
use App\UseCase\Query\AdminUserQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function __construct(
        private readonly AdminUserQueryService $users,
        private readonly CreateUserCommand $createUser,
        private readonly UpdateUserCommand $updateUser,
        private readonly UpdateUserRolesCommand $updateUserRoles,
        private readonly ToggleUserActiveCommand $toggleUserActive,
        private readonly DeleteUserCommand $deleteUser,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('admin');

        $validated = $request->validate([
            'search'   => ['nullable', 'string', 'max:120'],
            'page'     => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $paginator = $this->users->paginatedList(
            search: $validated['search'] ?? null,
            perPage: (int) ($validated['per_page'] ?? 20),
            page: (int) ($validated['page'] ?? 1),
        );

        $paginator->getCollection()->transform(fn (User $user): array => [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'roles'      => $user->roles->pluck('name'),
            'is_active'  => $user->is_active,
            'created_at' => $user->created_at?->toIso8601String(),
        ]);

        return response()->json($paginator);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('admin');

        $response = $this->createUser->execute($this->user(), $request->toDto());

        return response()->json(['data' => $response->jsonSerialize()], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('admin');

        $response = $this->updateUser->execute($this->user(), $user, $request->toDto());

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function updateRoles(UpdateUserRolesRequest $request, User $user): JsonResponse
    {
        $this->authorize('admin');

        $response = $this->updateUserRoles->execute($this->user(), $user, $request->toDto());

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function toggleActive(Request $request, User $user): JsonResponse
    {
        $this->authorize('admin');

        $response = $this->toggleUserActive->execute($this->user(), $user);

        return response()->json(['data' => $response->jsonSerialize()]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('admin');

        $this->deleteUser->execute($this->user(), $user);

        return response()->json(null, 204);
    }
}
