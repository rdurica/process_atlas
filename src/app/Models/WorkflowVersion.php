<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'created_by',
        'version_number',
        'is_published',
        'graph_json',
        'lock_version',
        'rollback_from_version_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'graph_json' => 'array',
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
     * @return BelongsTo<WorkflowVersion, $this>
     */
    public function rollbackSource(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class, 'rollback_from_version_id');
    }
}
