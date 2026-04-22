<?php

namespace App\Services\Audit;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

final class AuditLogger
{
    /**
     * @param  array<string, mixed>  $properties
     */
    public static function log(
        User $actor,
        Model $subject,
        string $event,
        string $description,
        array $properties = [],
        string $source = 'ui'
    ): void {
        activity('process_atlas')
            ->causedBy($actor)
            ->performedOn($subject)
            ->event($event)
            ->withProperties(array_merge($properties, ['source' => $source]))
            ->log($description);
    }
}
