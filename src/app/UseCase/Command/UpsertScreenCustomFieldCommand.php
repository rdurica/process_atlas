<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\UpsertScreenCustomFieldRequest;
use App\DTO\Response\ScreenCustomFieldResponse;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\Screen;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class UpsertScreenCustomFieldCommand
{
    public function __construct(
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, Screen $screen, UpsertScreenCustomFieldRequest $request): ScreenCustomFieldResponse
    {
        return $this->transactionManager->transactional(function () use ($actor, $screen, $request): ScreenCustomFieldResponse
        {
            $screen = Screen::query()
                ->with('workflowVersion')
                ->whereKey($screen->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_if($screen->workflowVersion->is_published, 422, 'Cannot modify a published revision.');

            $field = $screen->customFields()->updateOrCreate(
                ['key' => $request->key],
                [
                    'field_type' => $request->fieldType ?? 'text',
                    'value'      => $request->value,
                    'sort_order' => $request->hasSortOrder
                        ? $request->sortOrder
                        : (((int) $screen->customFields()->max('sort_order')) + 1),
                ],
            );

            AuditLogger::log($actor, $field, 'updated', 'Screen custom field upserted');

            return ScreenCustomFieldResponse::fromModel($field);
        });
    }
}
