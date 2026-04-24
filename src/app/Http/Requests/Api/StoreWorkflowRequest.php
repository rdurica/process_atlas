<?php

namespace App\Http\Requests\Api;

use App\DTO\Request\CreateWorkflowRequest as CreateWorkflowDto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreWorkflowRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
        ];
    }

    public function toDto(): CreateWorkflowDto
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return CreateWorkflowDto::fromArray($validated);
    }
}
