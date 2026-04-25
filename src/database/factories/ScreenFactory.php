<?php

namespace Database\Factories;

use App\Models\Screen;
use App\Models\User;
use App\Models\WorkflowRevision;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Screen>
 */
class ScreenFactory extends Factory
{
    protected $model = Screen::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workflow_revision_id' => WorkflowRevision::factory(),
            'node_id'              => fake()->uuid(),
            'title'                => fake()->sentence(),
            'subtitle'             => fake()->sentence(),
            'description'          => fake()->paragraph(),
            'image_path'           => null,
            'created_by'           => User::factory(),
            'updated_by'           => null,
        ];
    }
}
