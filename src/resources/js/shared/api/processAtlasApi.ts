import type { WorkflowRevisionSummary, WorkflowSummary } from '@/types/processAtlas';

export type CreateUserPayload = {
    name: string;
    email: string;
    password: string;
    roles: string[];
};

export type AdminUserItem = {
    id: number;
    name: string;
    email: string;
    roles: string[];
    is_active: boolean;
    created_at?: string | null;
};

export type AdminUsersResponse = {
    data: AdminUserItem[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
};

export const processAtlasApi = {
    projects: {
        create(payload: { name: string; description: string | null }) {
            return window.axios.post('/api/v1/projects', payload);
        },
        workflows(projectId: number, includeArchived = false, signal?: AbortSignal) {
            return window.axios.get<{ data: WorkflowSummary[] }>(
                `/api/v1/projects/${projectId}/workflows`,
                {
                    params: includeArchived ? { include_archived: 1 } : undefined,
                    signal,
                }
            );
        },
        createWorkflow(projectId: number, payload: { name: string }) {
            return window.axios.post<{ data?: { id?: number } }>(
                `/api/v1/projects/${projectId}/workflows`,
                payload
            );
        },
    },
    workflows: {
        archive(workflowId: number) {
            return window.axios.post(`/api/v1/workflows/${workflowId}/archive`);
        },
        unarchive(workflowId: number) {
            return window.axios.post(`/api/v1/workflows/${workflowId}/unarchive`);
        },
        createRevision(
            workflowId: number,
            payload: { draft_name?: string; source_revision_id?: number }
        ) {
            return window.axios.post(`/api/v1/workflows/${workflowId}/revisions`, payload);
        },
    },
    revisions: {
        publish(revisionId: number, force: boolean) {
            return window.axios.post(`/api/v1/workflow-revisions/${revisionId}/publish`, { force });
        },
        delete(revisionId: number) {
            return window.axios.delete(`/api/v1/workflow-revisions/${revisionId}`);
        },
        switchToDraft(revisionId: number) {
            return window.axios.post(`/api/v1/workflow-revisions/${revisionId}/switch-to-draft`);
        },
        get(revisionId: number) {
            return window.axios.get<{ data: WorkflowRevisionSummary }>(
                `/api/v1/workflow-revisions/${revisionId}`
            );
        },
        saveDraftName(revisionId: number, draftName: string) {
            return window.axios.patch(`/api/v1/workflow-revisions/${revisionId}/draft-name`, {
                draft_name: draftName,
            });
        },
        saveGraph(
            revisionId: number,
            payload: {
                graph_json: unknown;
                lock_version: number;
                source: 'ui' | 'autosave';
            }
        ) {
            return window.axios.patch<{ data: { lock_version: number } }>(
                `/api/v1/workflow-revisions/${revisionId}/graph`,
                payload
            );
        },
    },
    screens: {
        upsert(form: FormData) {
            return window.axios.post('/api/v1/screens/upsert', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        },
        upsertCustomField(screenId: number, payload: Record<string, unknown>) {
            return window.axios.post(`/api/v1/screens/${screenId}/custom-fields/upsert`, payload);
        },
        deleteCustomField(fieldId: number) {
            return window.axios.delete(`/api/v1/custom-fields/${fieldId}`);
        },
    },
    adminUsers: {
        list(params: { page: number; per_page: number; search: string }, signal?: AbortSignal) {
            return window.axios.get<AdminUsersResponse>('/api/v1/admin/users', {
                params,
                signal,
            });
        },
        create(payload: CreateUserPayload) {
            return window.axios.post('/api/v1/admin/users', payload);
        },
        updateRoles(userId: number, roles: string[]) {
            return window.axios.patch(`/api/v1/admin/users/${userId}/roles`, { roles });
        },
        toggleActive(userId: number) {
            return window.axios.patch(`/api/v1/admin/users/${userId}/active`);
        },
        delete(userId: number) {
            return window.axios.delete(`/api/v1/admin/users/${userId}`);
        },
    },
};
