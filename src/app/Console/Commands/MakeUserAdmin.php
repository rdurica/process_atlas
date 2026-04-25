<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class MakeUserAdmin extends Command
{
    protected $signature = 'user:admin {email}';

    protected $description = 'Assign the admin role to a user by email.';

    public function handle(): int
    {
        $email = $this->argument('email');

        $user = User::query()->where('email', $email)->first();

        if (! $user)
        {
            $this->error("User with email {$email} not found.");

            return self::FAILURE;
        }

        $role = Role::findByName('admin', 'web');
        $user->syncRoles([$role]);

        $this->info("User {$user->name} ({$email}) is now an admin.");

        return self::SUCCESS;
    }
}
