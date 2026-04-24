<?php

namespace App\UseCase\Query;

use App\Models\Screen;

final class ScreenQueryService
{
    public function detailForApi(Screen $screen): Screen
    {
        return $screen->load(['customFields']);
    }
}
