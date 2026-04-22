<?php

namespace App\Http\Requests\Api;

use App\DTO\Command\UpdateProjectCommand;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }

    public function toDto(): UpdateProjectCommand
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return UpdateProjectCommand::fromArray($validated);
    }
}
