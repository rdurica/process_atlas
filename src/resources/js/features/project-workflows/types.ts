import type { WorkflowSummary } from '@/types/processAtlas';

export type WorkflowStatusFilter = 'all' | 'published' | 'draft';

export interface ProjectWorkflowsProps {
    project: {
        id: number;
        name: string;
        description?: string | null;
        is_public: boolean;
        archived_at?: string | null;
        workflows_count: number;
        current_user_role: 'process_owner' | 'editor' | 'viewer' | null;
    };
    workflows: WorkflowSummary[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}
