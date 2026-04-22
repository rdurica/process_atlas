<?php

namespace App\Http\Controllers\Api;

use App\Actions\ProjectMemberActionService;
use App\DTO\Result\ProjectMemberResult;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreProjectMemberRequest;
use App\Http\Requests\Api\UpdateProjectMemberRequest;
use App\Models\Project;
use App\Models\User;
use App\Queries\ProjectMemberQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectMemberController extends Controller
{
    public function __construct(
        private readonly ProjectMemberQueryService $members,
        private readonly ProjectMemberActionService $actions,
    ) {}

    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $members = array_map(
            static fn (ProjectMemberResult $member) => $member->toArray(),
            $this->members->list($project),
        );

        return response()->json(['data' => $members]);
    }

    public function store(StoreProjectMemberRequest $request, Project $project): JsonResponse
    {
        $this->authorize('manageMembers', $project);

        $command = $request->toDto();
        $member = $this->members->findByEmail($command->email);
        $payload = $this->actions->add($request->user(), $project, $member, $command);

        return response()->json(['data' => $payload->toArray()], 201);
    }

    public function update(UpdateProjectMemberRequest $request, Project $project, User $user): JsonResponse
    {
        $this->authorize('manageMembers', $project);

        $payload = $this->actions->updateRole(
            $request->user(),
            $project,
            $user,
            $request->toDto(),
        );

        return response()->json(['data' => $payload->toArray()]);
    }

    public function destroy(Request $request, Project $project, User $user): JsonResponse
    {
        $this->authorize('manageMembers', $project);

        $this->actions->remove($request->user(), $project, $user);

        return response()->json(status: 204);
    }
}
