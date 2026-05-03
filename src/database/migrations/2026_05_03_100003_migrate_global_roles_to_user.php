<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure 'user' role exists
        $userRoleId = DB::table('roles')->where('name', 'user')->value('id');
        if ($userRoleId === null)
        {
            $userRoleId = DB::table('roles')->insertGetId([
                'name'       => 'user',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $editorRoleId = DB::table('roles')->where('name', 'editor')->value('id');
        $viewerRoleId = DB::table('roles')->where('name', 'viewer')->value('id');

        if ($editorRoleId !== null)
        {
            DB::table('model_has_roles')
                ->where('role_id', $editorRoleId)
                ->update(['role_id' => $userRoleId]);
        }

        if ($viewerRoleId !== null)
        {
            DB::table('model_has_roles')
                ->where('role_id', $viewerRoleId)
                ->update(['role_id' => $userRoleId]);
        }

        // Delete old global roles
        DB::table('roles')->whereIn('name', ['editor', 'viewer'])->delete();
    }

    public function down(): void
    {
        // This migration is not reversible in a meaningful way
        // The roles would need to be recreated and re-assigned
    }
};
