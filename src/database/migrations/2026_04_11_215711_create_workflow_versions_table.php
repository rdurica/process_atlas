<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('workflow_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->boolean('is_published')->default(false);
            $table->jsonb('graph_json')->nullable();
            $table->unsignedInteger('lock_version')->default(0);
            $table->timestamps();

            $table->unique(['workflow_id', 'version_number']);
            $table->index(['workflow_id', 'is_published']);
        });

        Schema::table('workflows', function (Blueprint $table): void {
            $table
                ->foreign('latest_version_id')
                ->references('id')
                ->on('workflow_versions')
                ->nullOnDelete();

            $table
                ->foreign('published_version_id')
                ->references('id')
                ->on('workflow_versions')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflows', function (Blueprint $table): void {
            $table->dropForeign(['latest_version_id']);
            $table->dropForeign(['published_version_id']);
        });

        Schema::dropIfExists('workflow_versions');
    }
};
