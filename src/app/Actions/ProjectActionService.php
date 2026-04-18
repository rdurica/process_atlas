<?php

namespace App\Actions;

use App\DTO\Command\CreateProjectCommand;
use App\DTO\Command\UpdateProjectCommand;
use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;

final class ProjectActionService
{
    public function create(User $actor, CreateProjectCommand $command): Project
    {
        $project = Project::query()->create([
            'name' => $command->name,
            'description' => $command->description,
            'created_by' => $actor->id,
        ]);

        $project->members()->attach($actor->id, ['role' => 'process_owner']);

        AuditLogger::log($actor, $project, 'created', 'Project created');

        return $project;
    }

    public function update(User $actor, Project $project, UpdateProjectCommand $command): Project
    {
        $project->update($command->toArray());

        AuditLogger::log($actor, $project, 'updated', 'Project updated');

        return $project;
    }

    public function delete(User $actor, Project $project): void
    {
        $project->delete();

        AuditLogger::log($actor, $project, 'deleted', 'Project deleted');
    }
}
