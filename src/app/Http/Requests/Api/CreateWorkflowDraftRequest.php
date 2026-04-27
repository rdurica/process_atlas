<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CreateWorkflowDraftRequest extends FormRequest
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
            'draft_name'         => ['nullable', 'string', 'max:255'],
            'source_revision_id' => ['nullable', 'integer', 'exists:workflow_revisions,id'],
        ];
    }
}
