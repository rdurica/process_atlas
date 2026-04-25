<?php

namespace App\Models;

use Database\Factories\ScreenFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

#[Fillable(['workflow_revision_id', 'node_id', 'title', 'subtitle', 'description', 'image_path', 'created_by', 'updated_by'])]
#[Appends(['image_url'])]
class Screen extends Model
{
    /** @use HasFactory<ScreenFactory> */
    use HasFactory;

    /**
     * @return Attribute<string|null, never>
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->image_path
                ? Storage::disk('public')->url($this->image_path)
                : null,
        );
    }

    /**
     * @return BelongsTo<WorkflowRevision, $this>
     */
    public function workflowRevision(): BelongsTo
    {
        return $this->belongsTo(WorkflowRevision::class);
    }

    /**
     * @return HasMany<ScreenCustomField, $this>
     */
    public function customFields(): HasMany
    {
        return $this->hasMany(ScreenCustomField::class)->orderBy('sort_order');
    }
}
