<?php

namespace App\Http\Requests\Api;

use App\DTO\Request\UpdateScreenRequest as UpdateScreenDto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateScreenRequest extends FormRequest
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
            'title'       => ['nullable', 'string', 'max:255'],
            'subtitle'    => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }

    public function toDto(): UpdateScreenDto
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return UpdateScreenDto::fromArray($validated);
    }
}
