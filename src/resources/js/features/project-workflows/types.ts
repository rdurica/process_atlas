import type { ProjectRole, WorkflowSummary } from '@/types/processAtlas';

export type ProjectWorkflowsProps = {
    project: {
        id: number;
        name: string;
        description?: string | null;
        workflows_count: number;
        current_user_role: ProjectRole | null;
    };
    workflows: WorkflowSummary[];
};

export type WorkflowStatusFilter = 'all' | 'draft' | 'published';
