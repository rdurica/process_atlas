<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $this->authorize('admin');

        return Inertia::render('Admin/Users');
    }
}
