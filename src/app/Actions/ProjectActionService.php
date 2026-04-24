<?php

namespace App\Actions;

use App\DTO\Command\CreateProjectCommand;
use App\DTO\Command\UpdateProjectCommand;
use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Support\Facades\DB;

final class ProjectActionService
{
    public function create(User $actor, CreateProjectCommand $command): Project
    {
        return DB::transaction(function () use ($actor, $command): Project {
            $project = Project::query()->create([
                'name' => $command->name,
                'description' => $command->description,
                'created_by' => $actor->id,
            ]);

            $project->members()->attach($actor->id, ['role' => 'process_owner']);

            AuditLogger::log($actor, $project, 'created', 'Project created');

            return $project;
        });
    }

    public function update(User $actor, Project $project, UpdateProjectCommand $command): Project
    {
        $project->update($command->toArray());

        AuditLogger::log($actor, $project, 'updated', 'Project updated');

        return $project;
    }

    public function delete(User $actor, Project $project): void
    {
        AuditLogger::log($actor, $project, 'deleted', 'Project deleted');

        $project->delete();
    }
}
