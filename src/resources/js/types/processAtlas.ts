import { Edge, Node } from '@xyflow/react';

export interface ActivityItem {
    id: string;
    event: string;
    description: string;
    created_at?: string | null;
    causer_name: string;
    subject_label: string;
    subject_type: string;
}

export interface WorkflowSummary {
    id: string;
    name: string;
    status: 'draft' | 'published';
    latest_revision?: {
        id: string;
        revision_number: number | null;
        is_published: boolean;
    } | null;
    published_revision?: {
        id: string;
        revision_number: number;
    } | null;
    updated_at?: string | null;
    archived_at?: string | null;
}

export type ProjectRole = 'process_owner' | 'editor' | 'viewer';

export interface ProjectMember {
    id: string;
    name: string;
    email: string;
    role: ProjectRole;
}

export interface ProjectSummary {
    id: string;
    name: string;
    description?: string | null;
    is_public: boolean;
    archived_at?: string | null;
    workflows_count: number;
    latest_revision_label: string;
    status_summary: string;
    released_count: number;
    unreleased_count: number;
    current_user_role: ProjectRole | null;
    workflows: WorkflowSummary[];
}

export interface DashboardSummary {
    projects: number;
    workflows: number;
    unreleased_workflows: number;
    released_workflows: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export interface ScreenCustomField {
    id: string;
    key: string;
    field_type: 'text' | 'number' | 'boolean' | 'json';
    value?: string | null;
    sort_order: number;
}

export interface Screen {
    id: string;
    node_id: string;
    title?: string | null;
    subtitle?: string | null;
    note?: string | null;
    image_url?: string | null;
    drawing_json?: string | null;
    drawing_image_url?: string | null;
    custom_fields: ScreenCustomField[];
}

export interface WorkflowRevisionSummary {
    id: string;
    revision_number: number | null;
    draft_name: string | null;
    lock_version: number;
    is_published: boolean;
    is_locked: boolean;
    source_revision_id?: string | null;
    graph_json?: {
        nodes?: Node[];
        edges?: Edge[];
    } | null;
    screens: Screen[];
    created_at?: string | null;
    creator?: {
        id: string;
        name: string;
    } | null;
}

export interface WorkflowData {
    id: string;
    name: string;
    status: 'draft' | 'published';
    archived_at?: string | null;
    project: {
        id: string;
        name: string;
    };
    latest_revision?: WorkflowRevisionSummary | null;
    published_revision?: {
        id: string;
        revision_number: number;
    } | null;
    revisions: WorkflowRevisionSummary[];
}
