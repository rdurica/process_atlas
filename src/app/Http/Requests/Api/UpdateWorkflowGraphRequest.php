<?php

namespace App\Http\Requests\Api;

use App\DTO\Command\UpdateWorkflowGraphCommand;
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
            'graph_json' => ['required', 'array'],
            'graph_json.nodes' => ['present', 'array'],
            'graph_json.edges' => ['present', 'array'],
            'lock_version' => ['required', 'integer', 'min:0'],
        ];
    }

    public function toDto(): UpdateWorkflowGraphCommand
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return UpdateWorkflowGraphCommand::fromArray($validated);
    }
}
