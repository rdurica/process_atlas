<?php

namespace App\Models;

use Database\Factories\ScreenCustomFieldFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['screen_id', 'key', 'field_type', 'value', 'sort_order'])]
class ScreenCustomField extends Model
{
    /** @use HasFactory<ScreenCustomFieldFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Screen, $this>
     */
    public function screen(): BelongsTo
    {
        return $this->belongsTo(Screen::class);
    }
}
