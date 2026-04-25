<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\CreateUserRequest;
use App\DTO\Response\UserResponse;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class CreateUserCommand
{
    public function __construct(
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, CreateUserRequest $request): UserResponse
    {
        $user = $this->transactionManager->transactional(function () use ($request): User
        {
            $user = User::query()->create([
                'name'     => $request->name,
                'email'    => $request->email,
                'password' => $request->password,
            ]);

            if (! empty($request->roles))
            {
                $user->syncRoles($request->roles);
            }

            return $user;
        });

        AuditLogger::log($actor, $user, 'created', 'User created');

        return UserResponse::fromModel($user->load('roles'));
    }
}
