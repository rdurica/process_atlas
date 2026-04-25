<?php

namespace App\Providers;

use App\Infrastructure\Transaction\LaravelTransactionManager;
use App\Infrastructure\Transaction\TransactionManager;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(TransactionManager::class, LaravelTransactionManager::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Gate::define('admin', fn ($user) => $user->isAdmin());

        RateLimiter::for('api', function (Request $request): Limit
        {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('mcp', function (Request $request): Limit
        {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('password-reset', function (Request $request): Limit
        {
            $email = Str::lower((string) $request->input('email', ''));

            return Limit::perMinute(5)->by($email . '|' . $request->ip());
        });
    }
}
