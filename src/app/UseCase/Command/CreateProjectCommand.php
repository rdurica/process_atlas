<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\CreateProjectRequest;
use App\DTO\Response\ProjectResponse;
use App\Infrastructure\Transaction\TransactionManager;
use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class CreateProjectCommand
{
    public function __construct(
        private readonly TransactionManager $transactionManager,
    ) {}

    public function execute(User $actor, CreateProjectRequest $request): ProjectResponse
    {
        $project = $this->transactionManager->transactional(function () use ($actor, $request): Project
        {
            $project = Project::query()->create([
                'name'        => $request->name,
                'description' => $request->description,
                'created_by'  => $actor->id,
            ]);

            $project->members()->attach($actor->id, ['role' => 'process_owner']);

            return $project;
        });

        AuditLogger::log($actor, $project, 'created', 'Project created');

        return ProjectResponse::fromModel($project);
    }
}
