<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProjectMemberController;
use App\Http\Controllers\Api\ScreenController;
use App\Http\Controllers\Api\ScreenCustomFieldController;
use App\Http\Controllers\Api\WorkflowController;
use App\Http\Controllers\Api\WorkflowRevisionController;
use App\Http\Controllers\McpController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'verified', 'throttle:api'])->prefix('v1')->group(function (): void
{
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::patch('/projects/{project}', [ProjectController::class, 'update']);
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);

    Route::get('/projects/{project}/members', [ProjectMemberController::class, 'index']);
    Route::post('/projects/{project}/members', [ProjectMemberController::class, 'store']);
    Route::patch('/projects/{project}/members/{user}', [ProjectMemberController::class, 'update']);
    Route::delete('/projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy']);

    Route::get('/projects/{project}/workflows', [WorkflowController::class, 'index']);
    Route::post('/projects/{project}/workflows', [WorkflowController::class, 'store']);

    Route::get('/workflows/{workflow}', [WorkflowController::class, 'show']);
    Route::patch('/workflows/{workflow}', [WorkflowController::class, 'update']);
    Route::post('/workflows/{workflow}/archive', [WorkflowController::class, 'archive']);
    Route::post('/workflows/{workflow}/unarchive', [WorkflowController::class, 'unarchive']);
    Route::post('/workflows/{workflow}/revisions', [WorkflowRevisionController::class, 'createDraft']);
    Route::post('/workflows/{workflow}/rollback', [WorkflowRevisionController::class, 'rollback']);

    Route::get('/workflow-revisions/{workflowRevision}', [WorkflowRevisionController::class, 'show']);
    Route::patch('/workflow-revisions/{workflowRevision}/graph', [WorkflowRevisionController::class, 'updateGraph']);
    Route::post('/workflow-revisions/{workflowRevision}/publish', [WorkflowRevisionController::class, 'publish']);
    Route::delete('/workflow-revisions/{workflowRevision}', [WorkflowRevisionController::class, 'destroy']);

    Route::post('/screens/upsert', [ScreenController::class, 'upsert']);
    Route::get('/screens/{screen}', [ScreenController::class, 'show']);
    Route::patch('/screens/{screen}', [ScreenController::class, 'update']);

    Route::post('/screens/{screen}/custom-fields/upsert', [ScreenCustomFieldController::class, 'upsert']);
    Route::delete('/custom-fields/{screenCustomField}', [ScreenCustomFieldController::class, 'destroy']);

    Route::middleware('can:admin')->group(function (): void
    {
        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::post('/admin/users', [AdminUserController::class, 'store']);
        Route::patch('/admin/users/{user}', [AdminUserController::class, 'update']);
        Route::patch('/admin/users/{user}/roles', [AdminUserController::class, 'updateRoles']);
        Route::patch('/admin/users/{user}/active', [AdminUserController::class, 'toggleActive']);
        Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy']);
    });
});

Route::middleware(['auth:sanctum', 'verified', 'ability:mcp:use', 'throttle:mcp'])->post('/mcp', McpController::class);
