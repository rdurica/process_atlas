<?php

declare(strict_types=1);

namespace App\UseCase\Query;

use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

final class AdminUserQueryService
{
    /**
     * @return LengthAwarePaginator<int, User>
     */
    public function paginatedList(?string $search, int $perPage, int $page): LengthAwarePaginator
    {
        return User::query()
            ->with('roles')
            ->when($search, function ($query) use ($search): void
            {
                $query->where(function ($q) use ($search): void
                {
                    $q->where('name', 'ILIKE', "%{$search}%")
                        ->orWhere('email', 'ILIKE', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate($perPage, ['*'], 'page', $page);
    }
}
