import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    roles: string[];
    permissions: string[];
}

export type ProjectRole = 'process_owner' | 'editor' | 'viewer';

export interface ProjectNavItem {
    id: number;
    name: string;
    description?: string | null;
    current_user_role: ProjectRole | null;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User | null;
    };
    ziggy: Config & { location: string };
    projects?: ProjectNavItem[];
};
