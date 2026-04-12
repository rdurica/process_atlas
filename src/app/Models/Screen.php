<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Screen extends Model
{
    use HasFactory;

    protected $appends = ['image_url'];

    protected $fillable = [
        'workflow_version_id',
        'node_id',
        'title',
        'subtitle',
        'description',
        'image_path',
        'created_by',
        'updated_by',
    ];

    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->image_path
                ? Storage::disk('public')->url($this->image_path)
                : null,
        );
    }

    /**
     * @return BelongsTo<WorkflowVersion, $this>
     */
    public function workflowVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class);
    }

    /**
     * @return HasMany<ScreenCustomField, $this>
     */
    public function customFields(): HasMany
    {
        return $this->hasMany(ScreenCustomField::class)->orderBy('sort_order');
    }
}
