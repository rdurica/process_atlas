<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_members', function (Blueprint $table): void
        {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['process_owner', 'editor', 'viewer']);
            $table->timestamps();
            $table->unique(['project_id', 'user_id']);
        });

        // Backfill: existing project creators become process_owner
        DB::table('projects')->get()->each(function (object $project): void
        {
            DB::table('project_members')->insertOrIgnore([
                'project_id' => $project->id,
                'user_id'    => $project->created_by,
                'role'       => 'process_owner',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_members');
    }
};
