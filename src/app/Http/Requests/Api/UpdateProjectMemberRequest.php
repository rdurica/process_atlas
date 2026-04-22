<?php

namespace App\Http\Requests\Api;

use App\DTO\Command\UpdateProjectMemberRoleCommand;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectMemberRequest extends FormRequest
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
            'role' => ['required', 'string', 'in:process_owner,editor,viewer'],
        ];
    }

    public function toDto(): UpdateProjectMemberRoleCommand
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        return UpdateProjectMemberRoleCommand::fromArray($validated);
    }
}
