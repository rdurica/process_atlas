import type {
    WorkflowRevisionSummary,
    WorkflowSummary,
    PaginatedResponse,
    ProjectMember,
} from '@/types/processAtlas';

export type CreateUserPayload = {
    name: string;
    email: string;
    password: string;
    roles: string[];
};

export type AdminUserItem = {
    id: string;
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
        create(payload: { name: string; description: string | null; is_public: boolean }) {
            return window.axios.post('/api/v1/projects', payload);
        },
        list(params: {
            page: number;
            per_page?: number;
            search?: string;
            include_archived?: boolean;
        }) {
            return window.axios.get<PaginatedResponse<unknown>>('/api/v1/projects', { params });
        },
        update(
            projectId: string,
            payload: { name?: string; description?: string | null; is_public?: boolean }
        ) {
            return window.axios.patch(`/api/v1/projects/${projectId}`, payload);
        },
        archive(projectId: string) {
            return window.axios.post(`/api/v1/projects/${projectId}/archive`);
        },
        unarchive(projectId: string) {
            return window.axios.post(`/api/v1/projects/${projectId}/unarchive`);
        },
        workflows(
            projectId: string,
            params: {
                page?: number;
                per_page?: number;
                include_archived?: boolean;
                search?: string;
                status?: string;
            }
        ) {
            return window.axios.get<PaginatedResponse<WorkflowSummary>>(
                `/api/v1/projects/${projectId}/workflows`,
                { params }
            );
        },
        createWorkflow(projectId: string, payload: { name: string }) {
            return window.axios.post<{ data?: { id?: string } }>(
                `/api/v1/projects/${projectId}/workflows`,
                payload
            );
        },
        members(projectId: string) {
            return window.axios.get<{ data: ProjectMember[] }>(
                `/api/v1/projects/${projectId}/members`
            );
        },
        addMember(projectId: string, payload: { email: string; role: string }) {
            return window.axios.post<{ data: ProjectMember }>(
                `/api/v1/projects/${projectId}/members`,
                payload
            );
        },
        updateMember(projectId: string, userId: string, payload: { role: string }) {
            return window.axios.patch<{ data: ProjectMember }>(
                `/api/v1/projects/${projectId}/members/${userId}`,
                payload
            );
        },
        removeMember(projectId: string, userId: string) {
            return window.axios.delete(`/api/v1/projects/${projectId}/members/${userId}`);
        },
    },
    workflows: {
        archive(workflowId: string) {
            return window.axios.post(`/api/v1/workflows/${workflowId}/archive`);
        },
        unarchive(workflowId: string) {
            return window.axios.post(`/api/v1/workflows/${workflowId}/unarchive`);
        },
        createRevision(
            workflowId: string,
            payload: { draft_name?: string; source_revision_id?: string }
        ) {
            return window.axios.post(`/api/v1/workflows/${workflowId}/revisions`, payload);
        },
    },
    revisions: {
        publish(revisionId: string, force: boolean) {
            return window.axios.post(`/api/v1/workflow-revisions/${revisionId}/publish`, { force });
        },
        delete(revisionId: string) {
            return window.axios.delete(`/api/v1/workflow-revisions/${revisionId}`);
        },
        switchToDraft(revisionId: string) {
            return window.axios.post(`/api/v1/workflow-revisions/${revisionId}/switch-to-draft`);
        },
        get(revisionId: string) {
            return window.axios.get<{ data: WorkflowRevisionSummary }>(
                `/api/v1/workflow-revisions/${revisionId}`
            );
        },
        saveDraftName(revisionId: string, draftName: string) {
            return window.axios.patch(`/api/v1/workflow-revisions/${revisionId}/draft-name`, {
                draft_name: draftName,
            });
        },
        saveGraph(
            revisionId: string,
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
        upsertCustomField(screenId: string, payload: Record<string, unknown>) {
            return window.axios.post(`/api/v1/screens/${screenId}/custom-fields/upsert`, payload);
        },
        deleteCustomField(fieldId: string) {
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
        updateRoles(userId: string, roles: string[]) {
            return window.axios.patch(`/api/v1/admin/users/${userId}/roles`, { roles });
        },
        toggleActive(userId: string) {
            return window.axios.patch(`/api/v1/admin/users/${userId}/active`);
        },
        delete(userId: string) {
            return window.axios.delete(`/api/v1/admin/users/${userId}`);
        },
    },
};
