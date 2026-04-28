import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import { formatDate } from '@/shared/lib/dates';
import type { PageProps } from '@/types';
import { ALL_ROLES } from './types';
import { roleTone, useAdminUsers } from './useAdminUsers';

export default function AdminUsersPage() {
    const user = usePage<PageProps>().props.auth.user;
    const adminUsers = useAdminUsers();

    if (!user?.is_admin) {
        window.location.href = route('dashboard');
        return null;
    }

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
                        onClick={() => adminUsers.setShowCreateModal(true)}
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
                    <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                        <div className="relative min-w-[260px] lg:w-[320px]">
                            <input
                                type="text"
                                value={adminUsers.searchQuery}
                                onChange={event => adminUsers.setSearchQuery(event.target.value)}
                                placeholder="Search by name or email..."
                                className="input-shell"
                            />
                            {adminUsers.loading && adminUsers.users.length > 0 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <svg
                                        className="h-4 w-4 animate-spin text-slate-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto px-6 pb-6">
                    {adminUsers.loading && adminUsers.users.length === 0 ? (
                        <div className="empty-state py-12">Loading users…</div>
                    ) : adminUsers.users.length === 0 ? (
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
                                {adminUsers.users.map(item => (
                                    <tr key={item.id} className="data-row">
                                        <td>
                                            <p className="font-semibold text-slate-950">
                                                {item.name}
                                            </p>
                                        </td>
                                        <td className="text-slate-600">{item.email}</td>
                                        <td>
                                            <div className="flex flex-wrap gap-1.5">
                                                {item.roles.map(role => (
                                                    <StatusBadge key={role} tone={roleTone(role)}>
                                                        {role}
                                                    </StatusBadge>
                                                ))}
                                                {item.roles.length === 0 && (
                                                    <span className="text-sm text-slate-400">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge
                                                tone={item.is_active ? 'success' : 'neutral'}
                                            >
                                                {item.is_active ? 'Active' : 'Disabled'}
                                            </StatusBadge>
                                        </td>
                                        <td className="text-slate-600">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => adminUsers.openRolesModal(item)}
                                                    className="btn-secondary px-2 py-1 text-xs"
                                                >
                                                    Edit Roles
                                                </button>
                                                {item.id !== user.id && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                adminUsers.handleToggleActive(
                                                                    item.id
                                                                )
                                                            }
                                                            disabled={
                                                                adminUsers.pendingToggle === item.id
                                                            }
                                                            className={`px-2 py-1 text-xs ${
                                                                item.is_active
                                                                    ? 'btn-ghost text-amber-700 hover:bg-amber-50'
                                                                    : 'btn-secondary'
                                                            }`}
                                                        >
                                                            {adminUsers.pendingToggle === item.id
                                                                ? '…'
                                                                : item.is_active
                                                                  ? 'Disable'
                                                                  : 'Enable'}
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                adminUsers.handleDelete(item.id)
                                                            }
                                                            disabled={
                                                                adminUsers.pendingDelete === item.id
                                                            }
                                                            className="btn-danger px-2 py-1 text-xs"
                                                        >
                                                            {adminUsers.pendingDelete === item.id
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
                {!adminUsers.loading && adminUsers.total > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-200/70 px-6 py-4">
                        <p className="text-sm text-slate-500">
                            Showing {adminUsers.from} to {adminUsers.to} of {adminUsers.total} users
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    adminUsers.fetchUsers(
                                        adminUsers.page - 1,
                                        adminUsers.searchQuery
                                    )
                                }
                                disabled={adminUsers.page <= 1}
                                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-slate-600">
                                Page {adminUsers.page} of {adminUsers.lastPage}
                            </span>
                            <button
                                onClick={() =>
                                    adminUsers.fetchUsers(
                                        adminUsers.page + 1,
                                        adminUsers.searchQuery
                                    )
                                }
                                disabled={adminUsers.page >= adminUsers.lastPage}
                                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <Modal
                show={adminUsers.showCreateModal}
                onClose={adminUsers.closeCreateModal}
                maxWidth="lg"
            >
                <form onSubmit={adminUsers.handleCreate} className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="eyebrow">Create User</p>
                        <h2 className="panel-title mt-2">Add a new system user</h2>
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                        Name
                        <input
                            type="text"
                            value={adminUsers.form.name}
                            onChange={event =>
                                adminUsers.setForm({ ...adminUsers.form, name: event.target.value })
                            }
                            disabled={adminUsers.pendingCreate}
                            className="input-shell mt-2"
                        />
                    </label>
                    {adminUsers.errors.name && (
                        <p className="mt-1 text-xs text-red-600">{adminUsers.errors.name}</p>
                    )}

                    <label className="block text-sm font-medium text-slate-700">
                        Email
                        <input
                            type="email"
                            value={adminUsers.form.email}
                            onChange={event =>
                                adminUsers.setForm({
                                    ...adminUsers.form,
                                    email: event.target.value,
                                })
                            }
                            disabled={adminUsers.pendingCreate}
                            className="input-shell mt-2"
                        />
                    </label>
                    {adminUsers.errors.email && (
                        <p className="mt-1 text-xs text-red-600">{adminUsers.errors.email}</p>
                    )}

                    <label className="block text-sm font-medium text-slate-700">
                        Password
                        <input
                            type="password"
                            value={adminUsers.form.password}
                            onChange={event =>
                                adminUsers.setForm({
                                    ...adminUsers.form,
                                    password: event.target.value,
                                })
                            }
                            disabled={adminUsers.pendingCreate}
                            className="input-shell mt-2"
                        />
                    </label>
                    {adminUsers.errors.password && (
                        <p className="mt-1 text-xs text-red-600">{adminUsers.errors.password}</p>
                    )}

                    <div>
                        <p className="block text-sm font-medium text-slate-700">Roles</p>
                        <div className="mt-2 flex flex-wrap gap-3">
                            {ALL_ROLES.map(role => (
                                <label key={role} className="flex items-center gap-1.5 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={adminUsers.form.roles.includes(role)}
                                        onChange={() =>
                                            adminUsers.setForm({
                                                ...adminUsers.form,
                                                roles: adminUsers.form.roles.includes(role)
                                                    ? adminUsers.form.roles.filter(
                                                          item => item !== role
                                                      )
                                                    : [...adminUsers.form.roles, role],
                                            })
                                        }
                                        disabled={adminUsers.pendingCreate}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    {role}
                                </label>
                            ))}
                        </div>
                    </div>

                    {adminUsers.formError && (
                        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {adminUsers.formError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={adminUsers.closeCreateModal}
                            disabled={adminUsers.pendingCreate}
                            className="btn-ghost px-4 py-3 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={adminUsers.pendingCreate}
                            className="btn-primary px-4 py-3 text-sm"
                        >
                            {adminUsers.pendingCreate ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                show={adminUsers.showRolesModal}
                onClose={adminUsers.closeRolesModal}
                maxWidth="md"
            >
                <form onSubmit={adminUsers.handleUpdateRoles} className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="eyebrow">Edit Roles</p>
                        <h2 className="panel-title mt-2">{adminUsers.editingUser?.name}</h2>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {ALL_ROLES.map(role => (
                            <label key={role} className="flex items-center gap-1.5 text-sm">
                                <input
                                    type="checkbox"
                                    checked={adminUsers.editingUser?.roles.includes(role) ?? false}
                                    onChange={() => adminUsers.toggleRole(role)}
                                    disabled={adminUsers.pendingRoles}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                {role}
                            </label>
                        ))}
                    </div>

                    {adminUsers.formError && (
                        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {adminUsers.formError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={adminUsers.closeRolesModal}
                            disabled={adminUsers.pendingRoles}
                            className="btn-ghost px-4 py-3 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={adminUsers.pendingRoles}
                            className="btn-primary px-4 py-3 text-sm"
                        >
                            {adminUsers.pendingRoles ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
