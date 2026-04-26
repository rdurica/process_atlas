<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowRevision;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkflowRevision>
 */
class WorkflowRevisionFactory extends Factory
{
    protected $model = WorkflowRevision::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workflow_id'               => Workflow::factory(),
            'created_by'                => User::factory(),
            'revision_number'           => fake()->numberBetween(1, 100),
            'is_published'              => false,
            'is_locked'                 => false,
            'graph_json'                => null,
            'lock_version'              => 0,
            'rollback_from_revision_id' => null,
        ];
    }
}
