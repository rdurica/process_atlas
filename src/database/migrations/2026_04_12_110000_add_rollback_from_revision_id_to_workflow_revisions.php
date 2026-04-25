<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflow_revisions', function (Blueprint $table): void
        {
            $table->foreignId('rollback_from_revision_id')
                ->nullable()
                ->constrained('workflow_revisions')
                ->nullOnDelete()
                ->after('lock_version');
        });
    }

    public function down(): void
    {
        Schema::table('workflow_revisions', function (Blueprint $table): void
        {
            $table->dropForeign(['rollback_from_revision_id']);
            $table->dropColumn('rollback_from_revision_id');
        });
    }
};
