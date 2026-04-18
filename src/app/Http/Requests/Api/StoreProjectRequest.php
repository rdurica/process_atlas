<?php

namespace App\Http\Requests\Api;

use App\DTO\Command\CreateProjectCommand;
use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }

    public function toDto(): CreateProjectCommand
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return CreateProjectCommand::fromArray($validated);
    }
}
