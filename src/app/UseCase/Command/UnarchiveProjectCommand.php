<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class UnarchiveProjectCommand
{
    public function execute(User $actor, Project $project): Project
    {
        $project->update(['archived_at' => null]);

        // Cascade unarchive all workflows in the project
        $project->workflows()->update(['archived_at' => null]);

        AuditLogger::log($actor, $project, 'unarchived', 'Project unarchived');

        return $project->fresh() ?? $project;
    }
}
