<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('screens', function (Blueprint $table)
        {
            $table->longText('drawing_json')->nullable()->after('image_path');
            $table->string('drawing_image_path')->nullable()->after('drawing_json');
        });
    }

    public function down(): void
    {
        Schema::table('screens', function (Blueprint $table)
        {
            $table->dropColumn(['drawing_json', 'drawing_image_path']);
        });
    }
};
