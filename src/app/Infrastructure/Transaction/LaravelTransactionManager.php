<?php

declare(strict_types=1);

namespace App\Infrastructure\Transaction;

use Illuminate\Support\Facades\DB;

final readonly class LaravelTransactionManager implements TransactionManager
{
    /**
     * @template T
     *
     * @param  \Closure(): T  $callback
     * @return T
     */
    public function transactional(\Closure $callback): mixed
    {
        return DB::transaction($callback);
    }
}
