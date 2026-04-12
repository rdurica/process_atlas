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
        Schema::create('screen_custom_fields', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('screen_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->string('field_type')->default('text');
            $table->text('value')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['screen_id', 'key']);
            $table->index(['screen_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('screen_custom_fields');
    }
};
