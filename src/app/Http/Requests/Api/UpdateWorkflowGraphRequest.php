<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkflowGraphRequest extends FormRequest
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
            'graph_json' => ['required', 'array'],
            'graph_json.nodes' => ['present', 'array'],
            'graph_json.edges' => ['present', 'array'],
            'lock_version' => ['required', 'integer', 'min:0'],
        ];
    }
}
