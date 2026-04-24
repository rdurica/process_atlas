<?php

namespace App\Http\Requests\Api;

use App\DTO\Command\UpsertScreenCommand;
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
            'workflow_version_id' => ['required', 'integer', 'exists:workflow_versions,id'],
            'node_id' => ['required', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ];
    }

    public function toDto(): UpsertScreenCommand
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return UpsertScreenCommand::fromArray($validated, $this->file('image'));
    }
}
