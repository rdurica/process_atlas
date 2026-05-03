<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Project;
use App\Models\Screen;
use App\Models\User;
use App\Models\Workflow;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateLargeWorkflow extends Command
{
    protected $signature = 'workflow:generate-large-test';

    protected $description = 'Generate a large test workflow with ~100 nodes';

    public function handle(): int
    {
        $user = User::query()->firstOrCreate(
            ['email' => 'owner@example.com'],
            ['name' => 'Owner', 'password' => 'password', 'email_verified_at' => now()],
        );

        if (! $user->hasRole('process_owner'))
        {
            $user->assignRole('process_owner');
        }

        $project = Project::query()->firstOrCreate(
            ['name' => 'Large Test Project'],
            ['description' => 'Project for testing large workflows', 'created_by' => $user->id],
        );

        $project->members()->syncWithoutDetaching([$user->id => ['role' => 'process_owner']]);

        $workflow = Workflow::query()->create([
            'project_id' => $project->id,
            'name'       => 'Large Test Workflow (' . now()->format('Y-m-d H:i') . ')',
            'status'     => 'draft',
        ]);

        $revision = $workflow->revisions()->create([
            'created_by'      => $user->id,
            'revision_number' => null,
            'draft_name'      => 'Draft#1',
            'is_published'    => false,
            'is_locked'       => false,
            'graph_json'      => ['nodes' => [], 'edges' => []],
            'lock_version'    => 0,
        ]);

        $workflow->update(['latest_revision_id' => $revision->id]);

        $nodes = [];
        $edges = [];
        $screenNodes = [];

        // Start node
        $startId = $this->nodeId('start');
        $nodes[] = [
            'id'       => $startId,
            'type'     => 'start',
            'data'     => ['label' => 'Start', 'security_rule' => null],
            'position' => ['x' => 100, 'y' => 300],
        ];

        $previousIds = [$startId];
        $nodeCount = 1;
        $yBase = 300;

        $nodeTypes = ['screen', 'action', 'notification', 'condition', 'timer', 'subprocess', 'note'];
        $screenTitles = [
            'Login', 'Dashboard', 'Profile', 'Settings', 'Checkout', 'Payment',
            'Confirmation', 'Review', 'Cart', 'Shipping', 'Billing', 'Summary',
            'Welcome', 'Onboarding', 'Verification', 'Approval', 'Rejection',
            'Success', 'Error', 'Loading', 'Timeout', 'Redirect', 'Complete',
            'Details', 'List', 'Search', 'Filter', 'Sort', 'Pagination',
            'Form', 'Input', 'Upload', 'Download', 'Preview', 'Print',
            'Share', 'Export', 'Import', 'Clone', 'Delete', 'Archive',
            'Restore', 'Merge', 'Split', 'Compare', 'Diff', 'History',
            'Notifications', 'Messages', 'Chat', 'Call', 'Video', 'Audio',
        ];
        $actionTitles = [
            'Validate Input', 'Send Email', 'Process Payment', 'Update Record',
            'Create Order', 'Notify User', 'Log Event', 'Check Permissions',
            'Fetch Data', 'Sync External', 'Trigger Webhook', 'Run Script',
            'Compress Files', 'Generate Report', 'Send SMS', 'Push Notification',
            'Schedule Task', 'Queue Job', 'Cache Data', 'Invalidate Cache',
            'Send Alert', 'Escalate Issue', 'Assign Ticket', 'Resolve Ticket',
            'Close Ticket', 'Reopen Ticket', 'Merge Tickets', 'Split Ticket',
            'Transfer Ticket', 'Archive Ticket',
        ];
        $notificationTexts = [
            'Info: Operation completed', 'Warning: Check your input',
            'Success: Saved successfully', 'Error: Something went wrong',
            'Info: Loading data...', 'Warning: Session expiring',
            'Success: Payment received', 'Error: Validation failed',
            'Info: New updates available', 'Warning: Low disk space',
        ];
        $conditions = [
            'user.is_authenticated', 'order.total > 100',
            'payment.status == "paid"', 'inventory.count > 0',
            'user.role == "admin"', 'request.is_valid',
            'data.is_complete', 'service.is_available',
            'feature.is_enabled', 'quota.not_exceeded',
        ];

        while ($nodeCount < 95)
        {
            $type = $nodeTypes[array_rand($nodeTypes)];
            $x = 100 + ($nodeCount * 180);
            $y = $yBase + rand(-150, 150);

            switch ($type)
            {
                case 'screen':
                    $id = $this->nodeId('screen');
                    $title = $screenTitles[array_rand($screenTitles)] . ' ' . (intdiv($nodeCount, 2) + 1);
                    $nodes[] = [
                        'id'   => $id,
                        'type' => 'screen',
                        'data' => [
                            'label'         => $title,
                            'subtitle'      => 'Subtitle for ' . $title,
                            'security_rule' => null,
                        ],
                        'position' => ['x' => $x, 'y' => $y],
                    ];
                    $screenNodes[] = ['node_id' => $id, 'title' => $title];
                    break;

                case 'action':
                    $id = $this->nodeId('action');
                    $nodes[] = [
                        'id'   => $id,
                        'type' => 'action',
                        'data' => [
                            'title'         => $actionTitles[array_rand($actionTitles)],
                            'note'          => 'Automated action step',
                            'security_rule' => null,
                        ],
                        'position' => ['x' => $x, 'y' => $y],
                    ];
                    break;

                case 'notification':
                    $id = $this->nodeId('notification');
                    $nodes[] = [
                        'id'   => $id,
                        'type' => 'notification',
                        'data' => [
                            'severity'    => ['info', 'warning', 'success', 'error'][array_rand(['info', 'warning', 'success', 'error'])],
                            'text'        => $notificationTexts[array_rand($notificationTexts)],
                            'description' => 'Notification',
                        ],
                        'position' => ['x' => $x, 'y' => $y],
                    ];
                    break;

                case 'timer':
                    $id = $this->nodeId('timer');
                    $nodes[] = [
                        'id'   => $id,
                        'type' => 'timer',
                        'data' => [
                            'text' => 'Wait ' . rand(1, 24) . ' hours',
                        ],
                        'position' => ['x' => $x, 'y' => $y],
                    ];
                    break;

                case 'subprocess':
                    $id = $this->nodeId('subprocess');
                    $nodes[] = [
                        'id'   => $id,
                        'type' => 'subprocess',
                        'data' => [
                            'linked_workflow_id'   => null,
                            'linked_workflow_name' => null,
                        ],
                        'position' => ['x' => $x, 'y' => $y],
                    ];
                    break;

                case 'note':
                    $id = $this->nodeId('note');
                    $nodes[] = [
                        'id'   => $id,
                        'type' => 'note',
                        'data' => [
                            'text' => 'Annotation ' . $nodeCount,
                        ],
                        'position' => ['x' => $x, 'y' => $y],
                    ];
                    break;

                case 'condition':
                    $id = $this->nodeId('condition');
                    $nodes[] = [
                        'id'   => $id,
                        'type' => 'condition',
                        'data' => [
                            'condition' => $conditions[array_rand($conditions)],
                        ],
                        'position' => ['x' => $x, 'y' => $y],
                    ];
                    break;
            }

            // Connect from random previous node
            $sourceId = $previousIds[array_rand($previousIds)];
            $edges[] = [
                'id'     => 'e-' . Str::random(8),
                'source' => $sourceId,
                'target' => $id,
            ];

            $previousIds[] = $id;
            $nodeCount++;

            // For condition nodes, sometimes add a second outgoing edge
            if ($type === 'condition' && rand(0, 1) === 1 && $nodeCount < 95)
            {
                $altId = $this->nodeId('screen');
                $title = $screenTitles[array_rand($screenTitles)] . ' (alt)';
                $nodes[] = [
                    'id'   => $altId,
                    'type' => 'screen',
                    'data' => [
                        'label'         => $title,
                        'subtitle'      => 'Alternative path',
                        'security_rule' => null,
                    ],
                    'position' => ['x' => $x + 90, 'y' => $y + 120],
                ];
                $screenNodes[] = ['node_id' => $altId, 'title' => $title];
                $edges[] = [
                    'id'           => 'e-' . Str::random(8),
                    'source'       => $id,
                    'target'       => $altId,
                    'sourceHandle' => 'out-2',
                ];
                $previousIds[] = $altId;
                $nodeCount++;
            }
        }

        // End node
        $endId = $this->nodeId('end');
        $nodes[] = [
            'id'   => $endId,
            'type' => 'end',
            'data' => [
                'title'                => 'End',
                'linked_workflow_id'   => null,
                'linked_workflow_name' => null,
            ],
            'position' => ['x' => 100 + ($nodeCount * 180), 'y' => $yBase],
        ];
        $edges[] = [
            'id'     => 'e-' . Str::random(8),
            'source' => $previousIds[array_rand($previousIds)],
            'target' => $endId,
        ];

        $revision->update([
            'graph_json' => [
                'nodes' => $nodes,
                'edges' => $edges,
            ],
        ]);

        // Create screens for screen nodes
        foreach ($screenNodes as $screen)
        {
            Screen::query()->create([
                'workflow_revision_id' => $revision->id,
                'node_id'              => $screen['node_id'],
                'title'                => $screen['title'],
                'subtitle'             => 'Auto-generated screen',
                'note'                 => 'This screen was generated by the test command.',
                'created_by'           => $user->id,
                'updated_by'           => $user->id,
            ]);
        }

        $this->info('Workflow created successfully!');
        $this->info("Workflow ID: {$workflow->id}");
        $this->info("Project: {$project->name}");
        $this->info('Nodes: ' . count($nodes));
        $this->info('Edges: ' . count($edges));
        $this->info('Screens: ' . count($screenNodes));
        $this->info("URL: /workflows/{$workflow->id}/edit");

        return self::SUCCESS;
    }

    private function nodeId(string $kind): string
    {
        $prefix = match ($kind)
        {
            'screen'       => 'SCR',
            'notification' => 'NOT',
            'condition'    => 'CON',
            'if'           => 'CON',
            'action'       => 'ACT',
            'timer'        => 'TMR',
            'subprocess'   => 'SUB',
            'note'         => 'NTE',
            'start'        => 'STR',
            'end'          => 'END',
            default        => 'NOD',
        };

        return "{$prefix}-" . Str::uuid()->toString();
    }
}
