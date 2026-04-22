<?php

namespace App\Http\Requests\Api;

use App\DTO\Command\AddProjectMemberCommand;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProjectMemberRequest extends FormRequest
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
            'email' => ['required', 'email', 'exists:users,email'],
            'role' => ['required', 'string', 'in:process_owner,editor,viewer'],
        ];
    }

    public function toDto(): AddProjectMemberCommand
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return AddProjectMemberCommand::fromArray($validated);
    }
}
