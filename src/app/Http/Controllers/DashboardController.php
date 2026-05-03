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
        $page = (int) $request->input('page', 1);
        $search = $request->input('search');
        $status = $request->input('status');
        $includeArchived = $request->boolean('include_archived');

        $data = $this->dashboard->getDashboardData(
            $this->user(),
            $page,
            20,
            $search,
            $status,
            $includeArchived,
        );
        $data['recentActivity'] = $this->activity->latestForDashboard();

        return Inertia::render('Dashboard', $data);
    }
}
