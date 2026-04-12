<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScreenCustomField extends Model
{
    use HasFactory;

    protected $fillable = [
        'screen_id',
        'key',
        'field_type',
        'value',
        'sort_order',
    ];

    /**
     * @return BelongsTo<Screen, $this>
     */
    public function screen(): BelongsTo
    {
        return $this->belongsTo(Screen::class);
    }
}
