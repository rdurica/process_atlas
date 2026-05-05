<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Database\Factories\WorkflowRevisionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['workflow_id', 'created_by', 'revision_number', 'draft_name', 'is_published', 'is_locked', 'graph_json', 'lock_version', 'source_revision_id'])]
class WorkflowRevision extends Model
{
    /** @use HasFactory<WorkflowRevisionFactory> */
    use HasFactory, HasUuid;

    /**
     * @var list<string>
     */
    protected $hidden = ['id'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'is_locked'    => 'boolean',
            'graph_json'   => 'array',
            'draft_name'   => 'string',
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
    public function sourceRevision(): BelongsTo
    {
        return $this->belongsTo(WorkflowRevision::class, 'source_revision_id');
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

        if ($this->relationLoaded('sourceRevision') && array_key_exists('source_revision_id', $array))
        {
            $array['source_revision_id'] = $this->sourceRevision?->uuid;
        }

        return $array;
    }
}
