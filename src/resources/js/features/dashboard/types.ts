import type { DashboardSummary, ProjectSummary } from '@/types/processAtlas';

export type DashboardStatusFilter = 'all' | 'published' | 'draft' | 'empty';

export interface DashboardProps {
    summary: DashboardSummary;
    projects: ProjectSummary[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    recentActivity?: unknown[];
}
