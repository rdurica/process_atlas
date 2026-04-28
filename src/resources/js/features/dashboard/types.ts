import type { DashboardSummary, ProjectSummary } from '@/types/processAtlas';

export type DashboardProps = {
    summary: DashboardSummary;
    projects: ProjectSummary[];
};

export type DashboardStatusFilter = 'all' | 'published' | 'draft' | 'empty';
