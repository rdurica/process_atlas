import { Edge, Node } from '@xyflow/react';

export interface ActivityItem {
    id: number;
    event: string;
    description: string;
    created_at?: string | null;
    causer_name: string;
    subject_label: string;
    subject_type: string;
}

export interface WorkflowSummary {
    id: number;
    name: string;
    status: 'draft' | 'published';
    latest_revision?: {
        id: number;
        revision_number: number;
        is_published: boolean;
    } | null;
    published_revision_id?: number | null;
    updated_at?: string | null;
    archived_at?: string | null;
}

export type ProjectRole = 'process_owner' | 'editor' | 'viewer';

export interface ProjectMember {
    id: number;
    name: string;
    email: string;
    role: ProjectRole;
}

export interface ProjectSummary {
    id: number;
    name: string;
    description?: string | null;
    workflows_count: number;
    latest_revision_label: string;
    status_summary: string;
    current_user_role: ProjectRole | null;
    workflows: WorkflowSummary[];
}

export interface DashboardSummary {
    projects: number;
    workflows: number;
    draft_revisions: number;
    published_workflows: number;
}

export interface ScreenCustomField {
    id: number;
    key: string;
    field_type: 'text' | 'number' | 'boolean' | 'json';
    value?: string | null;
    sort_order: number;
}

export interface Screen {
    id: number;
    node_id: string;
    title?: string | null;
    subtitle?: string | null;
    description?: string | null;
    image_url?: string | null;
    custom_fields: ScreenCustomField[];
}

export interface WorkflowRevisionSummary {
    id: number;
    revision_number: number;
    lock_version: number;
    is_published: boolean;
    rollback_from_revision_id?: number | null;
    graph_json?: {
        nodes?: Node[];
        edges?: Edge[];
    } | null;
    screens: Screen[];
    created_at?: string | null;
    creator?: {
        id: number;
        name: string;
    } | null;
}

export interface WorkflowData {
    id: number;
    name: string;
    status: 'draft' | 'published';
    archived_at?: string | null;
    project: {
        id: number;
        name: string;
    };
    latest_revision?: WorkflowRevisionSummary | null;
    revisions: WorkflowRevisionSummary[];
}
