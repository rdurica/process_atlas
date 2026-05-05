<?php

namespace App\Http\Requests\Api;

use App\DTO\Request\UpsertScreenRequest as UpsertScreenDto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpsertScreenRequest extends FormRequest
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
            'workflow_revision_id' => ['required', 'string', 'exists:workflow_revisions,uuid'],
            'node_id'              => ['required', 'string', 'max:255'],
            'title'                => ['nullable', 'string', 'max:255'],
            'subtitle'             => ['nullable', 'string', 'max:255'],
            'note'                 => ['nullable', 'string'],
            'image'                => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:4096', 'dimensions:max_width=4096,max_height=4096'],
            'drawing_json'         => ['nullable', 'string'],
            'drawing_image'        => ['nullable', 'file', 'mimes:png', 'max:4096', 'dimensions:max_width=4096,max_height=4096'],
        ];
    }

    public function toDto(): UpsertScreenDto
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return UpsertScreenDto::fromArray($validated, $this->file('image'), $this->file('drawing_image'));
    }
}
