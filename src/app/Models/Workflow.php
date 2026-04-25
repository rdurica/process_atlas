<?php

namespace App\Models;

use Database\Factories\WorkflowFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workflow extends Model
{
    /** @use HasFactory<WorkflowFactory> */
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'status',
        'latest_revision_id',
        'published_revision_id',
        'archived_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<static>  $query
     */
    public function scopeArchived(Builder $query): void
    {
        $query->whereNotNull('archived_at');
    }

    /**
     * @param  Builder<static>  $query
     */
    public function scopeNotArchived(Builder $query): void
    {
        $query->whereNull('archived_at');
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return HasMany<WorkflowRevision, $this>
     */
    public function revisions(): HasMany
    {
        return $this->hasMany(WorkflowRevision::class);
    }

    /**
     * @return BelongsTo<WorkflowRevision, $this>
     */
    public function latestRevision(): BelongsTo
    {
        return $this->belongsTo(WorkflowRevision::class, 'latest_revision_id');
    }

    /**
     * @return BelongsTo<WorkflowRevision, $this>
     */
    public function publishedRevision(): BelongsTo
    {
        return $this->belongsTo(WorkflowRevision::class, 'published_revision_id');
    }
}
