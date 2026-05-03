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
            projectId: number,
            payload: { name?: string; description?: string | null; is_public?: boolean }
        ) {
            return window.axios.patch(`/api/v1/projects/${projectId}`, payload);
        },
        archive(projectId: number) {
            return window.axios.post(`/api/v1/projects/${projectId}/archive`);
        },
        unarchive(projectId: number) {
            return window.axios.post(`/api/v1/projects/${projectId}/unarchive`);
        },
        workflows(
            projectId: number,
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
        createWorkflow(projectId: number, payload: { name: string }) {
            return window.axios.post<{ data?: { id?: number } }>(
                `/api/v1/projects/${projectId}/workflows`,
                payload
            );
        },
        members(projectId: number) {
            return window.axios.get<{ data: ProjectMember[] }>(
                `/api/v1/projects/${projectId}/members`
            );
        },
        addMember(projectId: number, payload: { email: string; role: string }) {
            return window.axios.post<{ data: ProjectMember }>(
                `/api/v1/projects/${projectId}/members`,
                payload
            );
        },
        updateMember(projectId: number, userId: number, payload: { role: string }) {
            return window.axios.patch<{ data: ProjectMember }>(
                `/api/v1/projects/${projectId}/members/${userId}`,
                payload
            );
        },
        removeMember(projectId: number, userId: number) {
            return window.axios.delete(`/api/v1/projects/${projectId}/members/${userId}`);
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
