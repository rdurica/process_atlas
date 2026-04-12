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
        DB::table('activity_log')
            ->where('subject_type', 'App\\Models\\ScreenFlash')
            ->delete();

        Schema::dropIfExists('screen_flashes');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('screen_flashes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('screen_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('error');
            $table->text('text');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['screen_id', 'sort_order']);
        });
    }
};
