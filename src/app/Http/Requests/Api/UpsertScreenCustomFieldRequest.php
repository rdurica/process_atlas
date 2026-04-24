<?php

namespace App\Http\Requests\Api;

use App\DTO\Request\UpsertScreenCustomFieldRequest as UpsertScreenCustomFieldDto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpsertScreenCustomFieldRequest extends FormRequest
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
            'key'        => ['required', 'string', 'max:255'],
            'field_type' => ['nullable', 'string', 'in:text,number,boolean,json'],
            'value'      => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function toDto(): UpsertScreenCustomFieldDto
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return UpsertScreenCustomFieldDto::fromArray($validated);
    }
}
