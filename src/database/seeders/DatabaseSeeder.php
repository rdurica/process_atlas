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

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionList::all() as $permission) {
            Permission::query()->firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $ownerRole = Role::query()->firstOrCreate(['name' => 'owner', 'guard_name' => 'web']);
        $editorRole = Role::query()->firstOrCreate(['name' => 'editor', 'guard_name' => 'web']);
        $viewerRole = Role::query()->firstOrCreate(['name' => 'viewer', 'guard_name' => 'web']);

        $ownerRole->syncPermissions(PermissionList::all());

        $editorRole->syncPermissions([
            PermissionList::PROJECTS_VIEW,
            PermissionList::PROJECTS_MANAGE,
            PermissionList::WORKFLOWS_VIEW,
            PermissionList::WORKFLOWS_EDIT,
            PermissionList::MCP_USE,
        ]);

        $viewerRole->syncPermissions([
            PermissionList::PROJECTS_VIEW,
            PermissionList::WORKFLOWS_VIEW,
        ]);

        $owner = User::query()->firstOrCreate(
            ['email' => 'owner@example.com'],
            ['name' => 'Owner', 'password' => 'password']
        );
        $owner->assignRole('owner');

        $viewer = User::query()->firstOrCreate(
            ['email' => 'viewer@example.com'],
            ['name' => 'Viewer', 'password' => 'password']
        );
        $viewer->assignRole('viewer');
    }
}
