import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PROJECT_ROLE_LABELS } from '@/shared/lib/projectPermissions';
import { Head, Link } from '@inertiajs/react';
import { useDashboard } from './useDashboard';
import type { DashboardProps, DashboardStatusFilter } from './types';

export default function DashboardPage(props: DashboardProps) {
    const dashboard = useDashboard(props);

    return (
        <AuthenticatedLayout
            contentWidth="wide"
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="eyebrow">Dashboard</p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                            Operations Overview
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {dashboard.canCreateProjects && (
                            <button
                                type="button"
                                onClick={() => dashboard.setProjectModalOpen(true)}
                                className="btn-secondary px-4 py-2.5 text-sm"
                            >
                                New Project
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                    {dashboard.metrics.map(metric => (
                        <article
                            key={metric.label}
                            className={`surface-card metric-card ${metric.accentClass}`}
                        >
                            <p className="eyebrow">{metric.label}</p>
                            <p className="metric-value mt-4">{metric.value}</p>
                            <p className="mt-3 max-w-[18rem] text-sm text-slate-600">
                                {metric.detail}
                            </p>
                        </article>
                    ))}
                </section>

                <section className="surface-card table-shell">
                    <div className="command-bar border-b border-slate-200/70">
                        <div>
                            <p className="eyebrow">Projects</p>
                            <h2 className="panel-title mt-2">Your Workspaces</h2>
                        </div>

                        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                            <div className="min-w-[260px] lg:w-[320px]">
                                <input
                                    value={dashboard.query}
                                    onChange={event => dashboard.setQuery(event.target.value)}
                                    placeholder="Search projects"
                                    className="input-shell"
                                />
                            </div>
                            <div className="min-w-[180px]">
                                <select
                                    value={dashboard.statusFilter}
                                    onChange={event =>
                                        dashboard.setStatusFilter(
                                            event.target.value as DashboardStatusFilter
                                        )
                                    }
                                    className="select-shell"
                                >
                                    <option value="all">All statuses</option>
                                    <option value="published">Has published</option>
                                    <option value="draft">Has drafts</option>
                                    <option value="empty">No workflows</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto px-6 pb-6">
                        {dashboard.filteredProjects.length === 0 ? (
                            <div className="empty-state py-12">
                                No projects match the current filters.
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200/70">
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Name
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Status
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Role
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Workflows
                                        </th>
                                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {dashboard.filteredProjects.map(project => (
                                        <tr
                                            key={project.id}
                                            className="group transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="px-4 py-4">
                                                <Link
                                                    href={route('projects.show', {
                                                        project: project.id,
                                                    })}
                                                    className="block"
                                                >
                                                    <p className="font-semibold text-slate-950 group-hover:text-blue-600">
                                                        {project.name}
                                                    </p>
                                                    <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                                                        {project.description ||
                                                            'No project description'}
                                                    </p>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <StatusBadge tone="brand">
                                                        {project.latest_revision_label}
                                                    </StatusBadge>
                                                    <StatusBadge tone="neutral">
                                                        {project.status_summary}
                                                    </StatusBadge>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {project.current_user_role ? (
                                                    <span className="badge badge-neutral">
                                                        {
                                                            PROJECT_ROLE_LABELS[
                                                                project.current_user_role
                                                            ]
                                                        }
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="badge badge-neutral">
                                                    {project.workflows_count} workflows
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <Link
                                                    href={route('projects.show', {
                                                        project: project.id,
                                                    })}
                                                    className="btn-secondary px-3 py-1.5 text-xs"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </div>

            <Modal
                show={dashboard.projectModalOpen}
                onClose={dashboard.closeProjectModal}
                maxWidth="lg"
            >
                <form onSubmit={dashboard.createProject} className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="eyebrow">Create Project</p>
                        <h2 className="panel-title mt-2">Provision a new project workspace</h2>
                        <p className="mt-3 text-sm text-slate-600">
                            Create a project shell first, then attach workflows and revision-tracked
                            process maps.
                        </p>
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                        Project Name
                        <input
                            value={dashboard.projectName}
                            onChange={event => dashboard.setProjectName(event.target.value)}
                            required
                            disabled={!dashboard.canCreateProjects || dashboard.pendingProject}
                            className="input-shell mt-2"
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Description
                        <textarea
                            value={dashboard.projectDescription}
                            onChange={event => dashboard.setProjectDescription(event.target.value)}
                            disabled={!dashboard.canCreateProjects || dashboard.pendingProject}
                            className="textarea-shell mt-2"
                        />
                    </label>

                    {dashboard.projectError && (
                        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {dashboard.projectError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={dashboard.closeProjectModal}
                            className="btn-ghost px-4 py-3 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!dashboard.canCreateProjects || dashboard.pendingProject}
                            className="btn-primary px-4 py-3 text-sm"
                        >
                            Create Project
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
