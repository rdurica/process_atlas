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
        $userRole = Role::query()->firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

        $adminRole->syncPermissions(PermissionList::all());

        $processOwnerRole->syncPermissions([
            PermissionList::PROJECTS_CREATE,
            PermissionList::MCP_USE,
        ]);

        $userRole->syncPermissions([]);

        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin', 'password' => 'password', 'email_verified_at' => now()],
        );
        $admin->syncRoles(['admin']);

        $owner = User::query()->firstOrCreate(
            ['email' => 'owner@example.com'],
            ['name' => 'Owner', 'password' => 'password', 'email_verified_at' => now()],
        );
        $owner->syncRoles(['process_owner']);

        $user = User::query()->firstOrCreate(
            ['email' => 'user@example.com'],
            ['name' => 'User', 'password' => 'password', 'email_verified_at' => now()],
        );
        $user->syncRoles(['user']);
    }
}
