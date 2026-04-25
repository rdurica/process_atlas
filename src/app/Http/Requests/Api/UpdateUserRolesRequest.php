<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\DTO\Request\UpdateUserRolesRequest as UpdateUserRolesDto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRolesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'roles'   => ['required', 'array'],
            'roles.*' => ['string', Rule::in(['admin', 'process_owner', 'editor', 'viewer'])],
        ];
    }

    public function toDto(): UpdateUserRolesDto
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return UpdateUserRolesDto::fromArray($validated);
    }
}
