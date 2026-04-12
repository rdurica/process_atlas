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
    latest_version?: {
        id: number;
        version_number: number;
        is_published: boolean;
    } | null;
    published_version_id?: number | null;
    updated_at?: string | null;
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
    latest_version_label: string;
    status_summary: string;
    current_user_role: ProjectRole | null;
    workflows: WorkflowSummary[];
}

export interface DashboardSummary {
    projects: number;
    workflows: number;
    draft_versions: number;
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

export interface WorkflowVersionSummary {
    id: number;
    version_number: number;
    lock_version: number;
    is_published: boolean;
    rollback_from_version_id?: number | null;
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
    project: {
        id: number;
        name: string;
    };
    latest_version?: WorkflowVersionSummary | null;
    versions: WorkflowVersionSummary[];
}
