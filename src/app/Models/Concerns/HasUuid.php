<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * @phpstan-require-extends Model
 */
trait HasUuid
{
    public function initializeHasUuid(): void
    {
        if (! isset($this->casts['uuid']))
        {
            $this->casts['uuid'] = 'string';
        }
    }

    public static function bootHasUuid(): void
    {
        static::creating(static function (Model $model): void
        {
            if (empty($model->getAttribute('uuid')))
            {
                $model->setAttribute('uuid', Str::uuid7()->toString());
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $array = parent::toArray();

        if (array_key_exists('uuid', $array))
        {
            $array['id'] = $array['uuid'];
            unset($array['uuid']);
        }

        return $array;
    }

    /**
     * Retrieve the model for a bound value.
     *
     * @param  mixed  $value
     * @param  string|null  $field
     */
    public function resolveRouteBinding($value, $field = null): ?Model
    {
        return $this->where('uuid', $value)->first();
    }
}
