<?php

namespace App\Http\Controllers;

use App\Queries\DashboardQueryService;
use App\Support\ActivityFeed;
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
        $data = $this->dashboard->getDashboardData($request->user());
        $data['recentActivity'] = $this->activity->latestForDashboard();

        return Inertia::render('Dashboard', $data);
    }
}
