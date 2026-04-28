import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { processAtlasApi } from '@/shared/api/processAtlasApi';
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
        case 'editor':
            return 'warning';
        default:
            return 'neutral';
    }
}

export function useAdminUsers() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRolesModal, setShowRolesModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [form, setForm] = useState<UserFormState>(emptyUserForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [pendingCreate, setPendingCreate] = useState(false);
    const [pendingRoles, setPendingRoles] = useState(false);
    const [pendingToggle, setPendingToggle] = useState<number | null>(null);
    const [pendingDelete, setPendingDelete] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isFirstSearchEffect = useRef(true);

    const fetchUsers = useCallback(async (targetPage: number, targetSearch: string) => {
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        try {
            const response = await processAtlasApi.adminUsers.list(
                { page: targetPage, per_page: 20, search: targetSearch },
                controller.signal
            );
            setUsers(response.data.data);
            setPage(response.data.current_page);
            setLastPage(response.data.last_page);
            setTotal(response.data.total);
            setFrom(response.data.from);
            setTo(response.data.to);
        } catch (error) {
            if (axios.isCancel(error)) {
                return;
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchUsers(1, '');
    }, [fetchUsers]);

    useEffect(() => {
        if (isFirstSearchEffect.current) {
            isFirstSearchEffect.current = false;
            return;
        }

        const timer = setTimeout(() => {
            fetchUsers(1, searchQuery);
        }, 400);

        return () => clearTimeout(timer);
    }, [fetchUsers, searchQuery]);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

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
        setPendingCreate(true);

        try {
            await processAtlasApi.adminUsers.create(form);
            closeCreateModal();
            fetchUsers(page, searchQuery);
        } catch (error) {
            const serverErrors = validationErrorMap(error);
            if (Object.keys(serverErrors).length > 0) {
                setErrors(serverErrors);
            } else {
                setFormError(resolveApiError(error, 'The user could not be created.'));
            }
        } finally {
            setPendingCreate(false);
        }
    };

    const handleUpdateRoles = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!editingUser) {
            return;
        }

        setPendingRoles(true);

        try {
            await processAtlasApi.adminUsers.updateRoles(editingUser.id, editingUser.roles);
            closeRolesModal();
            fetchUsers(page, searchQuery);
        } catch (error) {
            setFormError(resolveApiError(error, 'The roles could not be updated.'));
        } finally {
            setPendingRoles(false);
        }
    };

    const handleToggleActive = async (userId: number) => {
        setPendingToggle(userId);

        try {
            await processAtlasApi.adminUsers.toggleActive(userId);
            fetchUsers(page, searchQuery);
        } finally {
            setPendingToggle(null);
        }
    };

    const handleDelete = async (userId: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        setPendingDelete(userId);

        try {
            await processAtlasApi.adminUsers.delete(userId);
            fetchUsers(page, searchQuery);
        } finally {
            setPendingDelete(null);
        }
    };

    const toggleRole = (role: string) => {
        setEditingUser(prev => {
            if (!prev) {
                return prev;
            }

            const hasRole = prev.roles.includes(role);

            return {
                ...prev,
                roles: hasRole ? prev.roles.filter(item => item !== role) : [...prev.roles, role],
            };
        });
    };

    return {
        users,
        loading,
        showCreateModal,
        setShowCreateModal,
        showRolesModal,
        editingUser,
        form,
        setForm,
        errors,
        formError,
        pendingCreate,
        pendingRoles,
        pendingToggle,
        pendingDelete,
        searchQuery,
        setSearchQuery,
        page,
        lastPage,
        total,
        from,
        to,
        fetchUsers,
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
