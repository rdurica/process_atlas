<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\DTO\Request\CreateUserRequest as CreateUserDto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
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
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            'roles'    => ['nullable', 'array'],
            'roles.*'  => ['string', Rule::in(['admin', 'process_owner', 'editor', 'viewer'])],
        ];
    }

    public function toDto(): CreateUserDto
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return CreateUserDto::fromArray($validated);
    }
}
