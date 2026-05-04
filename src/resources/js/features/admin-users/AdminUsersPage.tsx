import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import { formatDate } from '@/shared/lib/dates';
import type { PageProps } from '@/types';
import { ALL_ROLES } from './types';
import { roleTone, useAdminUsers } from './useAdminUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Search, UserPlus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

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
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Administration
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                            User Administration
                        </h1>
                    </div>
                    <Button onClick={() => adminUsers.setShowCreateModal(true)}>
                        <UserPlus className="mr-1.5 h-4 w-4" />
                        Add User
                    </Button>
                </div>
            }
        >
            <Head title="User Administration" />

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Users
                            </p>
                            <CardTitle className="mt-1 text-base">System Users</CardTitle>
                        </div>
                        <div className="relative min-w-[260px] lg:w-[320px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                value={adminUsers.searchQuery}
                                onChange={event => adminUsers.setSearchQuery(event.target.value)}
                                placeholder="Search by name or email..."
                                className="pl-9"
                            />
                            {adminUsers.loading && adminUsers.users.length > 0 && (
                                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {adminUsers.loading && adminUsers.users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                            <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
                        </div>
                    ) : adminUsers.users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                            <Search className="h-8 w-8 text-muted-foreground/50" />
                            <p className="mt-2 text-sm text-muted-foreground">No users found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adminUsers.users.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <p className="font-semibold text-foreground">
                                                {item.name}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {item.email}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5">
                                                {item.roles.map(role => (
                                                    <StatusBadge key={role} tone={roleTone(role)}>
                                                        {role}
                                                    </StatusBadge>
                                                ))}
                                                {item.roles.length === 0 && (
                                                    <span className="text-sm text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                tone={item.is_active ? 'success' : 'neutral'}
                                            >
                                                {item.is_active ? 'Active' : 'Disabled'}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(item.created_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => adminUsers.openRolesModal(item)}
                                                >
                                                    Edit Roles
                                                </Button>
                                                {item.id !== user.id && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className={
                                                                item.is_active
                                                                    ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                                                    : ''
                                                            }
                                                            onClick={() =>
                                                                adminUsers.handleToggleActive(
                                                                    item.id
                                                                )
                                                            }
                                                            disabled={
                                                                adminUsers.pendingToggle === item.id
                                                            }
                                                        >
                                                            {adminUsers.pendingToggle === item.id
                                                                ? '…'
                                                                : item.is_active
                                                                  ? 'Disable'
                                                                  : 'Enable'}
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                adminUsers.handleDelete(item.id)
                                                            }
                                                            disabled={
                                                                adminUsers.pendingDelete === item.id
                                                            }
                                                        >
                                                            {adminUsers.pendingDelete === item.id
                                                                ? '…'
                                                                : 'Delete'}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                {!adminUsers.loading && adminUsers.total > 0 && (
                    <div className="flex items-center justify-between border-t px-6 py-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {adminUsers.from} to {adminUsers.to} of {adminUsers.total} users
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adminUsers.fetchUsers(adminUsers.page - 1)}
                                disabled={adminUsers.page <= 1}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {adminUsers.page} of {adminUsers.lastPage}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adminUsers.fetchUsers(adminUsers.page + 1)}
                                disabled={adminUsers.page >= adminUsers.lastPage}
                            >
                                Next
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            <Modal
                show={adminUsers.showCreateModal}
                onClose={adminUsers.closeCreateModal}
                maxWidth="lg"
            >
                <form onSubmit={adminUsers.handleCreate} className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Create User
                        </p>
                        <h2 className="mt-1 text-base font-semibold">Add a new system user</h2>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Name</label>
                        <Input
                            type="text"
                            value={adminUsers.form.name}
                            onChange={event =>
                                adminUsers.setForm({
                                    ...adminUsers.form,
                                    name: event.target.value,
                                })
                            }
                            disabled={adminUsers.pendingCreate}
                        />
                        {adminUsers.errors.name && (
                            <p className="text-xs text-destructive">{adminUsers.errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <Input
                            type="email"
                            value={adminUsers.form.email}
                            onChange={event =>
                                adminUsers.setForm({
                                    ...adminUsers.form,
                                    email: event.target.value,
                                })
                            }
                            disabled={adminUsers.pendingCreate}
                        />
                        {adminUsers.errors.email && (
                            <p className="text-xs text-destructive">{adminUsers.errors.email}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Password</label>
                        <Input
                            type="password"
                            value={adminUsers.form.password}
                            onChange={event =>
                                adminUsers.setForm({
                                    ...adminUsers.form,
                                    password: event.target.value,
                                })
                            }
                            disabled={adminUsers.pendingCreate}
                        />
                        {adminUsers.errors.password && (
                            <p className="text-xs text-destructive">{adminUsers.errors.password}</p>
                        )}
                    </div>

                    <div>
                        <p className="text-sm font-medium text-foreground">Roles</p>
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
                                        className="rounded border-border text-primary focus:ring-ring"
                                    />
                                    {role}
                                </label>
                            ))}
                        </div>
                    </div>

                    {adminUsers.formError && (
                        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {adminUsers.formError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={adminUsers.closeCreateModal}
                            disabled={adminUsers.pendingCreate}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={adminUsers.pendingCreate}>
                            {adminUsers.pendingCreate ? 'Creating…' : 'Create'}
                        </Button>
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
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Edit Roles
                        </p>
                        <h2 className="mt-1 text-base font-semibold">
                            {adminUsers.editingUser?.name}
                        </h2>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {ALL_ROLES.map(role => (
                            <label key={role} className="flex items-center gap-1.5 text-sm">
                                <input
                                    type="checkbox"
                                    checked={adminUsers.editingUser?.roles.includes(role) ?? false}
                                    onChange={() => adminUsers.toggleRole(role)}
                                    disabled={adminUsers.pendingRoles}
                                    className="rounded border-border text-primary focus:ring-ring"
                                />
                                {role}
                            </label>
                        ))}
                    </div>

                    {adminUsers.formError && (
                        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {adminUsers.formError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={adminUsers.closeRolesModal}
                            disabled={adminUsers.pendingRoles}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={adminUsers.pendingRoles}>
                            {adminUsers.pendingRoles ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
