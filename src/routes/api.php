<?php

use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ScreenController;
use App\Http\Controllers\Api\ScreenCustomFieldController;
use App\Http\Controllers\Api\WorkflowController;
use App\Http\Controllers\Api\WorkflowVersionController;
use App\Http\Controllers\McpController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function (): void {
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::patch('/projects/{project}', [ProjectController::class, 'update']);
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);

    Route::get('/projects/{project}/workflows', [WorkflowController::class, 'index']);
    Route::post('/projects/{project}/workflows', [WorkflowController::class, 'store']);

    Route::get('/workflows/{workflow}', [WorkflowController::class, 'show']);
    Route::patch('/workflows/{workflow}', [WorkflowController::class, 'update']);
    Route::post('/workflows/{workflow}/versions', [WorkflowVersionController::class, 'createDraft']);
    Route::post('/workflows/{workflow}/rollback', [WorkflowVersionController::class, 'rollback']);

    Route::get('/workflow-versions/{workflowVersion}', [WorkflowVersionController::class, 'show']);
    Route::patch('/workflow-versions/{workflowVersion}/graph', [WorkflowVersionController::class, 'updateGraph']);
    Route::post('/workflow-versions/{workflowVersion}/publish', [WorkflowVersionController::class, 'publish']);

    Route::post('/screens/upsert', [ScreenController::class, 'upsert']);
    Route::get('/screens/{screen}', [ScreenController::class, 'show']);
    Route::patch('/screens/{screen}', [ScreenController::class, 'update']);

    Route::post('/screens/{screen}/custom-fields/upsert', [ScreenCustomFieldController::class, 'upsert']);
    Route::delete('/custom-fields/{screenCustomField}', [ScreenCustomFieldController::class, 'destroy']);
});

Route::middleware(['auth:sanctum'])->post('/mcp', McpController::class);
