<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\DTO\Response\ProjectMemberResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreProjectMemberRequest;
use App\Http\Requests\Api\UpdateProjectMemberRequest;
use App\Models\Project;
use App\Models\User;
use App\UseCase\Command\AddProjectMemberCommand;
use App\UseCase\Command\RemoveProjectMemberCommand;
use App\UseCase\Command\UpdateProjectMemberRoleCommand;
use App\UseCase\Query\ProjectMemberQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectMemberController extends Controller
{
    public function __construct(
        private readonly ProjectMemberQueryService $members,
        private readonly AddProjectMemberCommand $addMember,
        private readonly UpdateProjectMemberRoleCommand $updateMemberRole,
        private readonly RemoveProjectMemberCommand $removeMember,
    ) {}

    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $members = array_map(
            static fn (ProjectMemberResponse $member) => $member->toArray(),
            $this->members->list($project),
        );

        return response()->json(['data' => $members]);
    }

    public function store(StoreProjectMemberRequest $request, Project $project): JsonResponse
    {
        $this->authorize('manageMembers', $project);

        $command = $request->toDto();
        $member = $this->members->findByEmail($command->email);
        $response = $this->addMember->execute($this->user(), $project, $member, $command);

        return response()->json(['data' => $response->toArray()], 201);
    }

    public function update(UpdateProjectMemberRequest $request, Project $project, User $user): JsonResponse
    {
        $this->authorize('manageMembers', $project);

        $response = $this->updateMemberRole->execute(
            $this->user(),
            $project,
            $user,
            $request->toDto(),
        );

        return response()->json(['data' => $response->toArray()]);
    }

    public function destroy(Request $request, Project $project, User $user): JsonResponse
    {
        $this->authorize('manageMembers', $project);

        $this->removeMember->execute($this->user(), $project, $user);

        return response()->json(status: 204);
    }
}
