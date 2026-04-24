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
        Schema::table('screens', function (Blueprint $table): void
        {
            $table->string('subtitle')->nullable()->after('title');
        });

        Schema::rename('screen_error_messages', 'screen_flashes');

        Schema::table('screen_flashes', function (Blueprint $table): void
        {
            $table->dropColumn('code');
        });

        Schema::table('screen_flashes', function (Blueprint $table): void
        {
            $table->renameColumn('severity', 'type');
        });

        Schema::table('screen_flashes', function (Blueprint $table): void
        {
            $table->renameColumn('message', 'text');
        });

        Schema::table('screen_flashes', function (Blueprint $table): void
        {
            $table->text('description')->nullable()->after('text');
        });

        DB::table('activity_log')
            ->where('subject_type', 'App\\Models\\ScreenErrorMessage')
            ->update(['subject_type' => 'App\\Models\\ScreenFlash']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('screen_flashes', function (Blueprint $table): void
        {
            $table->dropColumn('description');
        });

        DB::table('activity_log')
            ->where('subject_type', 'App\\Models\\ScreenFlash')
            ->update(['subject_type' => 'App\\Models\\ScreenErrorMessage']);

        Schema::table('screen_flashes', function (Blueprint $table): void
        {
            $table->renameColumn('text', 'message');
        });

        Schema::table('screen_flashes', function (Blueprint $table): void
        {
            $table->renameColumn('type', 'severity');
        });

        Schema::table('screen_flashes', function (Blueprint $table): void
        {
            $table->string('code')->nullable()->after('screen_id');
        });

        Schema::rename('screen_flashes', 'screen_error_messages');

        Schema::table('screens', function (Blueprint $table): void
        {
            $table->dropColumn('subtitle');
        });
    }
};
