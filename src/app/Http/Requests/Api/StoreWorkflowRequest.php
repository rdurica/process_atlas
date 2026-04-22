<?php

namespace App\Http\Requests\Api;

use App\DTO\Command\CreateWorkflowCommand;
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

    public function toDto(): CreateWorkflowCommand
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return CreateWorkflowCommand::fromArray($validated);
    }
}
