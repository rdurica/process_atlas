<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\DTO\Request\UpdateProjectRequest;
use App\DTO\Response\ProjectResponse;
use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class UpdateProjectCommand
{
    public function execute(User $actor, Project $project, UpdateProjectRequest $request): ProjectResponse
    {
        $project->update($request->toArray());

        AuditLogger::log($actor, $project, 'updated', 'Project updated');

        return ProjectResponse::fromModel($project);
    }
}
