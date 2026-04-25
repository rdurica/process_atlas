import { Head, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';

type UserItem = {
    id: number;
    name: string;
    email: string;
    roles: string[];
    is_active: boolean;
    created_at?: string | null;
};

const ALL_ROLES = ['admin', 'process_owner', 'editor', 'viewer'];

function resolveApiError(error: unknown, fallback: string): string {
    const response = (
        error as {
            response?: {
                status?: number;
                data?: { message?: string; errors?: Record<string, string[]> };
            };
        }
    )?.response;

    if (!response) {
        return fallback;
    }

    if (response.status === 403) {
        return 'You do not have permission to perform this action.';
    }

    if (response.status === 422) {
        const validationErrors = response.data?.errors;
        if (validationErrors) {
            const first = Object.values(validationErrors)[0]?.[0];
            if (first) {
                return first;
            }
        }

        return response.data?.message ?? 'The submitted data is invalid.';
    }

    return response.data?.message ?? fallback;
}

function roleTone(role: string): 'neutral' | 'brand' | 'success' | 'warning' | 'danger' {
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

function formatTimestamp(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

export default function AdminUsers() {
    const user = usePage().props.auth.user;
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRolesModal, setShowRolesModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', roles: [] as string[] });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [pendingCreate, setPendingCreate] = useState(false);
    const [pendingRoles, setPendingRoles] = useState(false);
    const [pendingToggle, setPendingToggle] = useState<number | null>(null);
    const [pendingDelete, setPendingDelete] = useState<number | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await window.axios.get<{ data: UserItem[] }>('/api/v1/admin/users');
            setUsers(response.data.data);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setFormError(null);
        setPendingCreate(true);

        try {
            await window.axios.post('/api/v1/admin/users', form);
            setShowCreateModal(false);
            setForm({ name: '', email: '', password: '', roles: [] });
            fetchUsers();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
            const serverErrors = axiosErr.response?.data?.errors;
            if (serverErrors) {
                setErrors(
                    Object.fromEntries(
                        Object.entries(serverErrors).map(([k, v]) => [k, v[0] ?? ''])
                    )
                );
            } else {
                setFormError(resolveApiError(err, 'The user could not be created.'));
            }
        } finally {
            setPendingCreate(false);
        }
    };

    const handleUpdateRoles = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setPendingRoles(true);

        try {
            await window.axios.patch(`/api/v1/admin/users/${editingUser.id}/roles`, {
                roles: editingUser.roles,
            });
            setShowRolesModal(false);
            setEditingUser(null);
            fetchUsers();
        } catch (err: unknown) {
            setFormError(resolveApiError(err, 'The roles could not be updated.'));
        } finally {
            setPendingRoles(false);
        }
    };

    const handleToggleActive = async (id: number) => {
        setPendingToggle(id);
        try {
            await window.axios.patch(`/api/v1/admin/users/${id}/active`);
            fetchUsers();
        } catch {
            // ignore
        } finally {
            setPendingToggle(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        setPendingDelete(id);
        try {
            await window.axios.delete(`/api/v1/admin/users/${id}`);
            fetchUsers();
        } catch {
            // ignore
        } finally {
            setPendingDelete(null);
        }
    };

    const toggleRole = (role: string) => {
        setEditingUser(prev => {
            if (!prev) return prev;
            const has = prev.roles.includes(role);
            return {
                ...prev,
                roles: has ? prev.roles.filter(r => r !== role) : [...prev.roles, role],
            };
        });
    };

    return (
        <AuthenticatedLayout
            contentWidth="wide"
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="eyebrow">Administration</p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                            User Administration
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-secondary px-4 py-2.5 text-sm"
                    >
                        Add User
                    </button>
                </div>
            }
        >
            <Head title="User Administration" />

            <section className="surface-card table-shell">
                <div className="command-bar border-b border-slate-200/70">
                    <div>
                        <p className="eyebrow">Users</p>
                        <h2 className="panel-title mt-2">System Users</h2>
                    </div>
                </div>

                <div className="overflow-x-auto px-6 pb-6">
                    {loading ? (
                        <div className="empty-state py-12">Loading users…</div>
                    ) : users.length === 0 ? (
                        <div className="empty-state py-12">No users found.</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Roles</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="data-row">
                                        <td>
                                            <p className="font-semibold text-slate-950">{u.name}</p>
                                        </td>
                                        <td className="text-slate-600">{u.email}</td>
                                        <td>
                                            <div className="flex flex-wrap gap-1.5">
                                                {u.roles.map(role => (
                                                    <StatusBadge key={role} tone={roleTone(role)}>
                                                        {role}
                                                    </StatusBadge>
                                                ))}
                                                {u.roles.length === 0 && (
                                                    <span className="text-sm text-slate-400">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge tone={u.is_active ? 'success' : 'neutral'}>
                                                {u.is_active ? 'Active' : 'Disabled'}
                                            </StatusBadge>
                                        </td>
                                        <td className="text-slate-600">
                                            {formatTimestamp(u.created_at)}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingUser(u);
                                                        setFormError(null);
                                                        setShowRolesModal(true);
                                                    }}
                                                    className="btn-secondary px-2 py-1 text-xs"
                                                >
                                                    Edit Roles
                                                </button>
                                                {u.id !== user?.id && (
                                                    <>
                                                        <button
                                                            onClick={() => handleToggleActive(u.id)}
                                                            disabled={pendingToggle === u.id}
                                                            className={`px-2 py-1 text-xs ${u.is_active ? 'btn-ghost text-amber-700 hover:bg-amber-50' : 'btn-secondary'}`}
                                                        >
                                                            {pendingToggle === u.id
                                                                ? '…'
                                                                : u.is_active
                                                                  ? 'Disable'
                                                                  : 'Enable'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(u.id)}
                                                            disabled={pendingDelete === u.id}
                                                            className="btn-danger px-2 py-1 text-xs"
                                                        >
                                                            {pendingDelete === u.id
                                                                ? '…'
                                                                : 'Delete'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="lg">
                <form onSubmit={handleCreate} className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="eyebrow">Create User</p>
                        <h2 className="panel-title mt-2">Add a new system user</h2>
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                        Name
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            disabled={pendingCreate}
                            className="input-shell mt-2"
                        />
                    </label>
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}

                    <label className="block text-sm font-medium text-slate-700">
                        Email
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            disabled={pendingCreate}
                            className="input-shell mt-2"
                        />
                    </label>
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}

                    <label className="block text-sm font-medium text-slate-700">
                        Password
                        <input
                            type="password"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            disabled={pendingCreate}
                            className="input-shell mt-2"
                        />
                    </label>
                    {errors.password && (
                        <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                    )}

                    <div>
                        <p className="block text-sm font-medium text-slate-700">Roles</p>
                        <div className="mt-2 flex flex-wrap gap-3">
                            {ALL_ROLES.map(role => (
                                <label key={role} className="flex items-center gap-1.5 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={form.roles.includes(role)}
                                        onChange={() =>
                                            setForm({
                                                ...form,
                                                roles: form.roles.includes(role)
                                                    ? form.roles.filter(r => r !== role)
                                                    : [...form.roles, role],
                                            })
                                        }
                                        disabled={pendingCreate}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    {role}
                                </label>
                            ))}
                        </div>
                    </div>

                    {formError && (
                        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {formError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            disabled={pendingCreate}
                            className="btn-ghost px-4 py-3 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={pendingCreate}
                            className="btn-primary px-4 py-3 text-sm"
                        >
                            {pendingCreate ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal show={showRolesModal} onClose={() => setShowRolesModal(false)} maxWidth="md">
                <form onSubmit={handleUpdateRoles} className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="eyebrow">Edit Roles</p>
                        <h2 className="panel-title mt-2">{editingUser?.name}</h2>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {ALL_ROLES.map(role => (
                            <label key={role} className="flex items-center gap-1.5 text-sm">
                                <input
                                    type="checkbox"
                                    checked={editingUser?.roles.includes(role) ?? false}
                                    onChange={() => toggleRole(role)}
                                    disabled={pendingRoles}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                {role}
                            </label>
                        ))}
                    </div>

                    {formError && (
                        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {formError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowRolesModal(false)}
                            disabled={pendingRoles}
                            className="btn-ghost px-4 py-3 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={pendingRoles}
                            className="btn-primary px-4 py-3 text-sm"
                        >
                            {pendingRoles ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
