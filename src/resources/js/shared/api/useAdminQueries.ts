import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { processAtlasApi } from './processAtlasApi';
import type { AdminUsersResponse, CreateUserPayload } from './processAtlasApi';

const adminKeys = {
    all: ['admin', 'users'] as const,
    list: (params: { page: number; search: string }) => [...adminKeys.all, 'list', params] as const,
};

export function useAdminUsersQuery(page: number, search: string) {
    return useQuery({
        queryKey: adminKeys.list({ page, search }),
        queryFn: async () => {
            const response = await processAtlasApi.adminUsers.list({
                page,
                per_page: 20,
                search,
            });
            return response.data as AdminUsersResponse;
        },
    });
}

export function useCreateAdminUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateUserPayload) =>
            processAtlasApi.adminUsers.create(payload).then(() => undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.all });
        },
    });
}

export function useUpdateAdminUserRoles() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, roles }: { userId: number; roles: string[] }) =>
            processAtlasApi.adminUsers.updateRoles(userId, roles).then(() => undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.all });
        },
    });
}

export function useToggleAdminUserActive() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId: number) =>
            processAtlasApi.adminUsers.toggleActive(userId).then(() => undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.all });
        },
    });
}

export function useDeleteAdminUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId: number) =>
            processAtlasApi.adminUsers.delete(userId).then(() => undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.all });
        },
    });
}
