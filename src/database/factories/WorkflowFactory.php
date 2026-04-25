<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Workflow;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Workflow>
 */
class WorkflowFactory extends Factory
{
    protected $model = Workflow::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id'           => Project::factory(),
            'name'                 => fake()->name(),
            'status'               => 'draft',
            'latest_version_id'    => null,
            'published_version_id' => null,
            'archived_at'          => null,
        ];
    }
}
