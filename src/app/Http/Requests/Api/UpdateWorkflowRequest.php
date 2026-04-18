<?php

namespace App\Http\Requests\Api;

use App\DTO\Command\UpdateWorkflowCommand;
use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkflowRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'status' => ['sometimes', 'required', 'string', 'in:draft,published'],
        ];
    }

    public function toDto(): UpdateWorkflowCommand
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return UpdateWorkflowCommand::fromArray($validated);
    }
}
