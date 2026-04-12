<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class BackfillEditorsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:backfill-editors {--dry-run : Show changes without mutating data}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Promote existing viewer users to editor except fixture viewer@example.com and owners.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $viewerRole = Role::findOrCreate('viewer', 'web');
        $editorRole = Role::findOrCreate('editor', 'web');

        $dryRun = (bool) $this->option('dry-run');

        $candidates = User::query()
            ->whereHas('roles', fn ($query) => $query->where('name', $viewerRole->name))
            ->where('email', '!=', 'viewer@example.com')
            ->get();

        $promoted = 0;
        $skippedOwner = 0;

        foreach ($candidates as $user) {
            if ($user->hasRole('owner')) {
                $skippedOwner++;
                continue;
            }

            if (! $user->hasRole($editorRole->name)) {
                $promoted++;

                if (! $dryRun) {
                    $user->assignRole($editorRole);
                }
            }

            if ($user->hasRole($viewerRole->name) && ! $dryRun) {
                $user->removeRole($viewerRole);
            }
        }

        $this->info(sprintf(
            'Backfill finished. promoted=%d skipped_owner=%d dry_run=%s',
            $promoted,
            $skippedOwner,
            $dryRun ? 'yes' : 'no'
        ));

        return self::SUCCESS;
    }
}
