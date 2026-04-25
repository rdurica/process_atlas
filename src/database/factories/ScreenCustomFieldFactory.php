<?php

namespace Database\Factories;

use App\Models\Screen;
use App\Models\ScreenCustomField;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScreenCustomField>
 */
class ScreenCustomFieldFactory extends Factory
{
    protected $model = ScreenCustomField::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'screen_id'  => Screen::factory(),
            'key'        => fake()->word(),
            'field_type' => 'text',
            'value'      => fake()->sentence(),
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }
}
