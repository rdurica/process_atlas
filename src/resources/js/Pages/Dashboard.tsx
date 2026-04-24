import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import type { DashboardSummary, ProjectRole, ProjectSummary } from '@/types/processAtlas';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

type DashboardProps = {
    summary: DashboardSummary;
    projects: ProjectSummary[];
};

type StatusFilter = 'all' | 'published' | 'draft' | 'empty';

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

const ROLE_LABELS: Record<ProjectRole, string> = {
    process_owner: 'Process Owner',
    editor: 'Editor',
    viewer: 'Viewer',
};

export default function Dashboard({ summary, projects }: DashboardProps) {
    const page = usePage<PageProps>();
    const permissions = new Set(page.props.auth.user?.permissions ?? []);
    const canCreateProjects = permissions.has('projects.create');

    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [query, setQuery] = useState('');
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [pendingProject, setPendingProject] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);

    const filteredProjects = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return projects.filter(project => {
            const matchesQuery =
                normalizedQuery.length === 0 ||
                project.name.toLowerCase().includes(normalizedQuery) ||
                (project.description ?? '').toLowerCase().includes(normalizedQuery);

            if (!matchesQuery) {
                return false;
            }

            if (statusFilter === 'all') {
                return true;
            }

            if (statusFilter === 'empty') {
                return project.workflows_count === 0;
            }

            return project.workflows.some(workflow => workflow.status === statusFilter);
        });
    }, [projects, query, statusFilter]);

    const closeProjectModal = () => {
        setProjectModalOpen(false);
        setProjectError(null);
        setProjectName('');
        setProjectDescription('');
    };

    const reloadDashboard = () => {
        router.reload({
            only: ['summary', 'projects'],
        });
    };

    const createProject = async (event: FormEvent) => {
        event.preventDefault();

        if (!canCreateProjects) {
            setProjectError('You do not have permission to create projects.');
            return;
        }

        setPendingProject(true);
        setProjectError(null);

        try {
            await window.axios.post('/api/v1/projects', {
                name: projectName,
                description: projectDescription || null,
            });

            closeProjectModal();
            reloadDashboard();
        } catch (error) {
            setProjectError(resolveApiError(error, 'The project could not be created.'));
        } finally {
            setPendingProject(false);
        }
    };

    const metrics = [
        {
            label: 'Projects',
            value: summary.projects,
            detail: 'Active workspaces across the control plane.',
            accentClass: 'metric-card-projects',
        },
        {
            label: 'Workflows',
            value: summary.workflows,
            detail: 'Modeled processes currently available to teams.',
            accentClass: 'metric-card-workflows',
        },
        {
            label: 'Draft Revisions',
            value: summary.draft_versions,
            detail: 'Unpublished changes waiting for review or release.',
            accentClass: 'metric-card-drafts',
        },
        {
            label: 'Published Workflows',
            value: summary.published_workflows,
            detail: 'Processes with a live published revision.',
            accentClass: 'metric-card-published',
        },
    ];

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
                        {canCreateProjects && (
                            <button
                                type="button"
                                onClick={() => setProjectModalOpen(true)}
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
                    {metrics.map(metric => (
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
                                    value={query}
                                    onChange={event => setQuery(event.target.value)}
                                    placeholder="Search projects"
                                    className="input-shell"
                                />
                            </div>
                            <div className="min-w-[180px]">
                                <select
                                    value={statusFilter}
                                    onChange={event =>
                                        setStatusFilter(event.target.value as StatusFilter)
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
                        {filteredProjects.length === 0 ? (
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
                                    {filteredProjects.map(project => (
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
                                                        {project.latest_version_label}
                                                    </StatusBadge>
                                                    <StatusBadge tone="neutral">
                                                        {project.status_summary}
                                                    </StatusBadge>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {project.current_user_role ? (
                                                    <span className="badge badge-neutral">
                                                        {ROLE_LABELS[project.current_user_role]}
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

            {/* Create Project Modal */}
            <Modal show={projectModalOpen} onClose={closeProjectModal} maxWidth="lg">
                <form onSubmit={createProject} className="space-y-5 p-6 sm:p-7">
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
                            value={projectName}
                            onChange={event => setProjectName(event.target.value)}
                            required
                            disabled={!canCreateProjects || pendingProject}
                            className="input-shell mt-2"
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Description
                        <textarea
                            value={projectDescription}
                            onChange={event => setProjectDescription(event.target.value)}
                            disabled={!canCreateProjects || pendingProject}
                            className="textarea-shell mt-2"
                        />
                    </label>

                    {projectError && (
                        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {projectError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeProjectModal}
                            className="btn-ghost px-4 py-3 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canCreateProjects || pendingProject}
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
