<?php

namespace App\Http\Controllers;

use App\Support\ActivityFeed;
use App\UseCase\Query\DashboardQueryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardQueryService $dashboard,
        private readonly ActivityFeed $activity,
    ) {}

    public function __invoke(Request $request): Response
    {
        $validated = $request->validate([
            'page'             => ['nullable', 'integer', 'min:1'],
            'search'           => ['nullable', 'string', 'max:120'],
            'status'           => ['nullable', 'string', 'max:50'],
            'include_archived' => ['nullable', 'boolean'],
        ]);

        $page = (int) ($validated['page'] ?? 1);
        $search = $validated['search'] ?? null;
        $status = $validated['status'] ?? null;
        $includeArchived = $request->boolean('include_archived');

        $data = $this->dashboard->getDashboardData(
            $this->user(),
            $page,
            20,
            $search,
            $status,
            $includeArchived,
        );
        $data['recentActivity'] = $this->activity->latestForDashboard($this->user());

        return Inertia::render('Dashboard', $data);
    }
}
