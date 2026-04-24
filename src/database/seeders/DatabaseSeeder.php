<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\PermissionList;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionList::all() as $permission)
        {
            Permission::query()->firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $adminRole = Role::query()->firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $processOwnerRole = Role::query()->firstOrCreate(['name' => 'process_owner', 'guard_name' => 'web']);
        $editorRole = Role::query()->firstOrCreate(['name' => 'editor', 'guard_name' => 'web']);
        $viewerRole = Role::query()->firstOrCreate(['name' => 'viewer', 'guard_name' => 'web']);

        $adminRole->syncPermissions(PermissionList::all());

        $processOwnerRole->syncPermissions([
            PermissionList::PROJECTS_CREATE,
            PermissionList::MCP_USE,
        ]);

        $editorRole->syncPermissions([
            PermissionList::PROJECTS_CREATE,
            PermissionList::MCP_USE,
        ]);

        $viewerRole->syncPermissions([]);

        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin', 'password' => 'password'],
        );
        $admin->syncRoles(['admin']);

        // Keep owner@example.com as process_owner for backwards compatibility
        $owner = User::query()->firstOrCreate(
            ['email' => 'owner@example.com'],
            ['name' => 'Owner', 'password' => 'password'],
        );
        $owner->syncRoles(['process_owner']);

        $viewer = User::query()->firstOrCreate(
            ['email' => 'viewer@example.com'],
            ['name' => 'Viewer', 'password' => 'password'],
        );
        $viewer->syncRoles(['viewer']);
    }
}
