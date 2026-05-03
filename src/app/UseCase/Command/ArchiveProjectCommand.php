<?php

declare(strict_types=1);

namespace App\UseCase\Command;

use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class ArchiveProjectCommand
{
    public function execute(User $actor, Project $project): Project
    {
        $project->update(['archived_at' => now()]);

        // Cascade archive all workflows in the project
        $project->workflows()->update(['archived_at' => now()]);

        AuditLogger::log($actor, $project, 'archived', 'Project archived');

        return $project->fresh() ?? $project;
    }
}
