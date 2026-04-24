<?php

namespace App\Http\Requests\Api;

use App\DTO\Request\CreateProjectRequest as CreateProjectDto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
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
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }

    public function toDto(): CreateProjectDto
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return CreateProjectDto::fromArray($validated);
    }
}
