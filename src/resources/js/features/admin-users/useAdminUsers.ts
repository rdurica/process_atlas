import { useState, useEffect, useRef } from 'react';
import {
    useAdminUsersQuery,
    useCreateAdminUser,
    useUpdateAdminUserRoles,
    useToggleAdminUserActive,
    useDeleteAdminUser,
} from '@/shared/api/useAdminQueries';
import { resolveApiError, validationErrorMap } from '@/shared/lib/apiErrors';
import type { UserFormState, UserItem } from './types';

const emptyUserForm: UserFormState = {
    name: '',
    email: '',
    password: '',
    roles: [],
};

export function roleTone(role: string): 'neutral' | 'brand' | 'success' | 'warning' | 'danger' {
    switch (role) {
        case 'admin':
            return 'danger';
        case 'process_owner':
            return 'brand';
        case 'user':
            return 'success';
        default:
            return 'neutral';
    }
}

export function useAdminUsers() {
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRolesModal, setShowRolesModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [form, setForm] = useState<UserFormState>(emptyUserForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const isFirstSearchEffect = useRef(true);

    const { data, isLoading } = useAdminUsersQuery(page, searchQuery);
    const createMutation = useCreateAdminUser();
    const updateRolesMutation = useUpdateAdminUserRoles();
    const toggleActiveMutation = useToggleAdminUserActive();
    const deleteMutation = useDeleteAdminUser();

    const users = data?.data ?? [];
    const lastPage = data?.last_page ?? 1;
    const total = data?.total ?? 0;
    const from = data?.from ?? 0;
    const to = data?.to ?? 0;

    useEffect(() => {
        if (isFirstSearchEffect.current) {
            isFirstSearchEffect.current = false;
            return;
        }

        const timer = setTimeout(() => {
            setPage(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const openRolesModal = (user: UserItem) => {
        setEditingUser(user);
        setFormError(null);
        setShowRolesModal(true);
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        setForm(emptyUserForm);
        setErrors({});
        setFormError(null);
    };

    const closeRolesModal = () => {
        setShowRolesModal(false);
        setEditingUser(null);
        setFormError(null);
    };

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        setErrors({});
        setFormError(null);

        try {
            await createMutation.mutateAsync(form);
            closeCreateModal();
        } catch (error) {
            const serverErrors = validationErrorMap(error);
            if (Object.keys(serverErrors).length > 0) {
                setErrors(serverErrors);
            } else {
                setFormError(resolveApiError(error, 'The user could not be created.'));
            }
        }
    };

    const handleUpdateRoles = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!editingUser) return;

        try {
            await updateRolesMutation.mutateAsync({
                userId: editingUser.id,
                roles: editingUser.roles,
            });
            closeRolesModal();
        } catch (error) {
            setFormError(resolveApiError(error, 'The roles could not be updated.'));
        }
    };

    const handleToggleActive = async (userId: string) => {
        try {
            await toggleActiveMutation.mutateAsync(userId);
        } catch {
            // Error handled by mutation
        }
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            await deleteMutation.mutateAsync(userId);
        } catch {
            // Error handled by mutation
        }
    };

    const toggleRole = (role: string) => {
        setEditingUser(prev => {
            if (!prev) return prev;
            const hasRole = prev.roles.includes(role);
            return {
                ...prev,
                roles: hasRole ? prev.roles.filter(item => item !== role) : [...prev.roles, role],
            };
        });
    };

    return {
        users,
        loading: isLoading,
        showCreateModal,
        setShowCreateModal,
        showRolesModal,
        editingUser,
        form,
        setForm,
        errors,
        formError,
        pendingCreate: createMutation.isPending,
        pendingRoles: updateRolesMutation.isPending,
        pendingToggle: toggleActiveMutation.isPending
            ? (toggleActiveMutation.variables ?? null)
            : null,
        pendingDelete: deleteMutation.isPending ? (deleteMutation.variables ?? null) : null,
        searchQuery,
        setSearchQuery,
        page,
        lastPage,
        total,
        from,
        to,
        fetchUsers: setPage,
        openRolesModal,
        closeCreateModal,
        closeRolesModal,
        handleCreate,
        handleUpdateRoles,
        handleToggleActive,
        handleDelete,
        toggleRole,
    };
}
