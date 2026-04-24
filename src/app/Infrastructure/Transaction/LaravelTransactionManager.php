<?php

declare(strict_types=1);

namespace App\Infrastructure\Transaction;

use Illuminate\Support\Facades\DB;

final readonly class LaravelTransactionManager implements TransactionManager
{
    public function transactional(callable $callback): mixed
    {
        return DB::transaction($callback);
    }
}
