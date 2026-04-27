<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('workflow_revisions', function (Blueprint $table): void
        {
            $table->dropUnique(['workflow_id', 'revision_number']);
            $table->unsignedInteger('revision_number')->nullable()->change();
            $table->unique(['workflow_id', 'revision_number']);
            $table->string('draft_name')->nullable();
        });

        $this->migrateExistingData();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore revision_number for drafts before making it non-nullable
        $drafts = DB::table('workflow_revisions')
            ->whereNull('revision_number')
            ->orderBy('id')
            ->get();

        foreach ($drafts as $draft)
        {
            $maxRevision = DB::table('workflow_revisions')
                ->where('workflow_id', $draft->workflow_id)
                ->whereNotNull('revision_number')
                ->max('revision_number') ?? 0;

            DB::table('workflow_revisions')
                ->where('id', $draft->id)
                ->update(['revision_number' => $maxRevision + 1]);
        }

        Schema::table('workflow_revisions', function (Blueprint $table): void
        {
            $table->dropUnique(['workflow_id', 'revision_number']);
            $table->unsignedInteger('revision_number')->nullable(false)->change();
            $table->unique(['workflow_id', 'revision_number']);
            $table->dropColumn('draft_name');
        });
    }

    private function migrateExistingData(): void
    {
        $drafts = DB::table('workflow_revisions')
            ->where('is_published', false)
            ->orderBy('id')
            ->get();

        $workflowCounters = [];

        foreach ($drafts as $draft)
        {
            $workflowId = $draft->workflow_id;
            $workflowCounters[$workflowId] = ($workflowCounters[$workflowId] ?? 0) + 1;

            DB::table('workflow_revisions')
                ->where('id', $draft->id)
                ->update([
                    'revision_number' => null,
                    'draft_name'      => "Draft#{$workflowCounters[$workflowId]}",
                ]);
        }
    }
};
