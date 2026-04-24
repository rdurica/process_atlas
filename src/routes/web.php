<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Profile\McpTokenController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\WorkflowEditorController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('login'));

Route::middleware(['auth'])->group(function (): void {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');

    Route::get('/workflows/{workflow}', WorkflowEditorController::class)
        ->name('workflows.editor');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::middleware('can:mcp.use')->group(function () {
        Route::post('/profile/mcp-token', [McpTokenController::class, 'store'])->name('profile.mcp-token.store');
        Route::delete('/profile/mcp-token', [McpTokenController::class, 'destroy'])->name('profile.mcp-token.destroy');
    });
});

require __DIR__ . '/auth.php';
