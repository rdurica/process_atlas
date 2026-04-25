<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\DTO\Request\UpdateUserRequest as UpdateUserDto;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
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
        /** @var User $user */
        $user = $this->route('user');

        return [
            'name'  => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ];
    }

    public function toDto(): UpdateUserDto
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return UpdateUserDto::fromArray($validated);
    }
}
