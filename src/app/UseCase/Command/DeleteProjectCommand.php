<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class DeleteProjectCommand
{
    public function execute(User $actor, Project $project): void
    {
        AuditLogger::log($actor, $project, 'deleted', 'Project deleted');

        $project->delete();
    }
}
