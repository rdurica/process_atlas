<?php

namespace App\Models;

use Database\Factories\WorkflowRevisionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['workflow_id', 'created_by', 'revision_number', 'is_published', 'is_locked', 'graph_json', 'lock_version', 'rollback_from_revision_id'])]
class WorkflowRevision extends Model
{
    /** @use HasFactory<WorkflowRevisionFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'is_locked'    => 'boolean',
            'graph_json'   => 'array',
        ];
    }

    /**
     * @return BelongsTo<Workflow, $this>
     */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<Screen, $this>
     */
    public function screens(): HasMany
    {
        return $this->hasMany(Screen::class);
    }

    /**
     * @return BelongsTo<WorkflowRevision, $this>
     */
    public function rollbackSource(): BelongsTo
    {
        return $this->belongsTo(WorkflowRevision::class, 'rollback_from_revision_id');
    }
}
