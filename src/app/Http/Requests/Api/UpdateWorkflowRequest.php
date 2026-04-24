<?php

namespace App\Http\Requests\Api;

use App\DTO\Request\UpdateWorkflowRequest as UpdateWorkflowDto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkflowRequest extends FormRequest
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
            'name'   => ['sometimes', 'required', 'string', 'max:255'],
            'status' => ['prohibited'],
        ];
    }

    public function toDto(): UpdateWorkflowDto
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return UpdateWorkflowDto::fromArray($validated);
    }
}
