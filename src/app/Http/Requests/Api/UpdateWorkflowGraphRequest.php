<?php

namespace App\Http\Requests\Api;

use App\DTO\Request\UpdateWorkflowGraphRequest as UpdateWorkflowGraphDto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkflowGraphRequest extends FormRequest
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
            'graph_json'       => ['required', 'array'],
            'graph_json.nodes' => ['present', 'array'],
            'graph_json.edges' => ['present', 'array'],
            'lock_version'     => ['required', 'integer', 'min:0'],
            'source'           => ['nullable', 'string', 'in:ui,autosave'],
        ];
    }

    public function toDto(): UpdateWorkflowGraphDto
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return UpdateWorkflowGraphDto::fromArray($validated);
    }
}
