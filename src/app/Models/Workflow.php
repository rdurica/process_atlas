<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workflow extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'status',
        'latest_version_id',
        'published_version_id',
    ];

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return HasMany<WorkflowVersion, $this>
     */
    public function versions(): HasMany
    {
        return $this->hasMany(WorkflowVersion::class);
    }

    /**
     * @return BelongsTo<WorkflowVersion, $this>
     */
    public function latestVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class, 'latest_version_id');
    }

    /**
     * @return BelongsTo<WorkflowVersion, $this>
     */
    public function publishedVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class, 'published_version_id');
    }
}
