<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use App\Services\ProjectAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectMemberController extends Controller
{
    public function __construct(private readonly ProjectAccessService $access)
    {
    }

    public function index(Request $request, Project $project): JsonResponse
    {
        abort_unless($this->access->canView($request->user(), $project), 403, 'Forbidden.');

        $members = $project->members()->get()->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->pivot->role,
        ]);

        return response()->json(['data' => $members]);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        abort_unless($this->access->canManageMembers($request->user(), $project), 403, 'Forbidden.');

        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'role' => ['required', 'string', 'in:process_owner,editor,viewer'],
        ]);

        $member = User::where('email', $validated['email'])->firstOrFail();

        $project->members()->syncWithoutDetaching([
            $member->id => ['role' => $validated['role']],
        ]);
        AuditLogger::log($request->user(), $project, 'updated', 'Project member added', [
            'member_id' => $member->id,
            'role' => $validated['role'],
        ]);

        return response()->json([
            'data' => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'role' => $validated['role'],
            ],
        ], 201);
    }

    public function update(Request $request, Project $project, User $user): JsonResponse
    {
        abort_unless($this->access->canManageMembers($request->user(), $project), 403, 'Forbidden.');

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:process_owner,editor,viewer'],
        ]);

        $project->members()->updateExistingPivot($user->id, ['role' => $validated['role']]);

        AuditLogger::log($request->user(), $project, 'updated', 'Project member role updated', [
            'member_id' => $user->id,
            'role' => $validated['role'],
        ]);

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $validated['role'],
            ],
        ]);
    }

    public function destroy(Request $request, Project $project, User $user): JsonResponse
    {
        abort_unless($this->access->canManageMembers($request->user(), $project), 403, 'Forbidden.');

        // Prevent removing yourself if you are the last process_owner
        $processOwnerCount = $project->members()->wherePivot('role', 'process_owner')->count();
        $isThisUserProcessOwner = $project->members()
            ->wherePivot('user_id', $user->id)
            ->wherePivot('role', 'process_owner')
            ->exists();

        abort_if(
            $isThisUserProcessOwner && $processOwnerCount <= 1,
            422,
            'Cannot remove the last process owner from a project.'
        );

        $project->members()->detach($user->id);

        AuditLogger::log($request->user(), $project, 'updated', 'Project member removed', [
            'member_id' => $user->id,
        ]);

        return response()->json(status: 204);
    }
}
