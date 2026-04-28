import type { ProjectRole } from '@/types/processAtlas';

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
    process_owner: 'Process Owner',
    editor: 'Editor',
    viewer: 'Viewer',
};

export function canEditInProject(role: ProjectRole | null): boolean {
    return role === 'process_owner' || role === 'editor';
}

export function canArchiveInProject(role: ProjectRole | null): boolean {
    return role === 'process_owner';
}

export function canPublishInProject(role: ProjectRole | null): boolean {
    return role === 'process_owner';
}
