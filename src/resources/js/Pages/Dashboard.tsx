import ActivityFeed from '@/Components/ActivityFeed';
import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import type {
    ActivityItem,
    DashboardSummary,
    ProjectSummary,
    WorkflowSummary,
} from '@/types/processAtlas';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, Fragment, useEffect, useMemo, useState } from 'react';

type DashboardProps = {
    summary: DashboardSummary;
    projects: ProjectSummary[];
    recentActivity: ActivityItem[];
};

type StatusFilter = 'all' | 'draft' | 'published' | 'empty';

function resolveApiError(error: unknown, fallback: string): string {
    const response = (error as {
        response?: {
            status?: number;
            data?: { message?: string; errors?: Record<string, string[]> };
        };
    })?.response;

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

function workflowTone(status: WorkflowSummary['status']) {
    return status === 'published' ? 'success' : 'warning';
}

function formatTimestamp(value?: string | null): string {
    if (!value) {
        return 'No recent changes';
    }

    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export default function Dashboard({
    summary,
    projects,
    recentActivity,
}: DashboardProps) {
    const page = usePage<PageProps>();
    const permissions = new Set(page.props.auth.user?.permissions ?? []);
    const canManageProjects = permissions.has('projects.manage');
    const canEditWorkflows = permissions.has('workflows.edit');

    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [query, setQuery] = useState('');
    const [expandedProjectIds, setExpandedProjectIds] = useState<number[]>([]);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [workflowName, setWorkflowName] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
        projects[0]?.id ?? null,
    );
    const [pendingProject, setPendingProject] = useState(false);
    const [pendingWorkflow, setPendingWorkflow] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const [workflowError, setWorkflowError] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedProjectId && projects[0]) {
            setSelectedProjectId(projects[0].id);
            return;
        }

        if (
            selectedProjectId &&
            !projects.some((project) => project.id === selectedProjectId)
        ) {
            setSelectedProjectId(projects[0]?.id ?? null);
        }
    }, [projects, selectedProjectId]);

    const filteredProjects = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return projects.filter((project) => {
            const matchesQuery =
                normalizedQuery.length === 0 ||
                project.name.toLowerCase().includes(normalizedQuery) ||
                (project.description ?? '').toLowerCase().includes(normalizedQuery) ||
                project.workflows.some((workflow) =>
                    workflow.name.toLowerCase().includes(normalizedQuery),
                );

            if (!matchesQuery) {
                return false;
            }

            if (statusFilter === 'all') {
                return true;
            }

            if (statusFilter === 'empty') {
                return project.workflows.length === 0;
            }

            return project.workflows.some((workflow) => workflow.status === statusFilter);
        });
    }, [projects, query, statusFilter]);

    const toggleProject = (projectId: number) => {
        setExpandedProjectIds((current) =>
            current.includes(projectId)
                ? current.filter((id) => id !== projectId)
                : [...current, projectId],
        );
    };

    const openWorkflowModal = (projectId?: number) => {
        if (typeof projectId === 'number') {
            setSelectedProjectId(projectId);
        }

        setWorkflowError(null);
        setWorkflowModalOpen(true);
    };

    const closeProjectModal = () => {
        setProjectModalOpen(false);
        setProjectError(null);
        setProjectName('');
        setProjectDescription('');
    };

    const closeWorkflowModal = () => {
        setWorkflowModalOpen(false);
        setWorkflowError(null);
        setWorkflowName('');
    };

    const reloadDashboard = () => {
        router.reload({
            only: ['summary', 'projects', 'recentActivity'],
        });
    };

    const createProject = async (event: FormEvent) => {
        event.preventDefault();

        if (!canManageProjects) {
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
            setProjectError(
                resolveApiError(error, 'The project could not be created.'),
            );
        } finally {
            setPendingProject(false);
        }
    };

    const createWorkflow = async (event: FormEvent) => {
        event.preventDefault();

        if (!canEditWorkflows) {
            setWorkflowError('You do not have permission to create workflows.');
            return;
        }

        if (!selectedProjectId) {
            setWorkflowError('Select a project before creating a workflow.');
            return;
        }

        setPendingWorkflow(true);
        setWorkflowError(null);

        try {
            const response = await window.axios.post(
                `/api/v1/projects/${selectedProjectId}/workflows`,
                {
                    name: workflowName,
                },
            );

            const workflowId = response.data?.data?.id;
            closeWorkflowModal();

            if (workflowId) {
                window.location.href = route('workflows.editor', {
                    workflow: workflowId,
                });
                return;
            }

            reloadDashboard();
        } catch (error) {
            setWorkflowError(
                resolveApiError(error, 'The workflow could not be created.'),
            );
        } finally {
            setPendingWorkflow(false);
        }
    };

    const metrics = [
        {
            label: 'Projects',
            value: summary.projects,
            detail: 'Active workspaces across the control plane.',
        },
        {
            label: 'Workflows',
            value: summary.workflows,
            detail: 'Modeled processes currently available to teams.',
        },
        {
            label: 'Draft Versions',
            value: summary.draft_versions,
            detail: 'Unpublished changes waiting for review or release.',
        },
        {
            label: 'Published Workflows',
            value: summary.published_workflows,
            detail: 'Processes with a live published version.',
        },
    ];

    return (
        <AuthenticatedLayout
            contentWidth="wide"
            header={
                <div className="surface-card overflow-hidden px-6 py-6 sm:px-7 sm:py-7">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl">
                            <p className="eyebrow">Workflow Control Plane</p>
                            <h1 className="page-title mt-3">Operations Overview</h1>
                            <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                                Run the platform from a wider enterprise workspace with
                                project visibility, fast creation flows, and recent change
                                context in one place.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {canManageProjects && (
                                <button
                                    type="button"
                                    onClick={() => setProjectModalOpen(true)}
                                    className="btn-secondary px-4 py-3 text-sm"
                                >
                                    New Project
                                </button>
                            )}
                            {canEditWorkflows && (
                                <button
                                    type="button"
                                    onClick={() => openWorkflowModal()}
                                    className="btn-primary px-4 py-3 text-sm"
                                >
                                    New Workflow
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-6">
                    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                        {metrics.map((metric) => (
                            <article key={metric.label} className="surface-card metric-card">
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
                                <p className="eyebrow">Project Registry</p>
                                <h2 className="panel-title mt-2">Delivery Portfolio</h2>
                            </div>

                            <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                                <div className="min-w-[260px] lg:w-[320px]">
                                    <input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Search projects or workflows"
                                        className="input-shell"
                                    />
                                </div>
                                <div className="min-w-[180px]">
                                    <select
                                        value={statusFilter}
                                        onChange={(event) =>
                                            setStatusFilter(event.target.value as StatusFilter)
                                        }
                                        className="select-shell"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                        <option value="empty">No workflows</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={reloadDashboard}
                                    className="btn-ghost px-4 py-3 text-sm"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <div className="table-scroll">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Project</th>
                                        <th>Workflows</th>
                                        <th>Latest Version</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProjects.map((project) => {
                                        const isExpanded = expandedProjectIds.includes(project.id);

                                        return (
                                            <Fragment key={project.id}>
                                                <tr key={project.id} className="data-row">
                                                    <td>
                                                        <div className="max-w-[28rem]">
                                                            <p className="text-sm font-semibold text-slate-950">
                                                                {project.name}
                                                            </p>
                                                            <p className="mt-1 text-sm text-slate-600">
                                                                {project.description ||
                                                                    'No project description yet.'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-950">
                                                                {project.workflows_count}
                                                            </p>
                                                            <p className="mt-1 text-sm text-slate-500">
                                                                Registered workflows
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <StatusBadge tone="brand">
                                                            {project.latest_version_label}
                                                        </StatusBadge>
                                                    </td>
                                                    <td>
                                                        <p className="text-sm font-semibold text-slate-950">
                                                            {project.status_summary}
                                                        </p>
                                                    </td>
                                                    <td>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleProject(project.id)}
                                                                className="btn-ghost px-3 py-2 text-sm"
                                                            >
                                                                {isExpanded
                                                                    ? 'Collapse'
                                                                    : 'Expand'}
                                                            </button>
                                                            {canEditWorkflows && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openWorkflowModal(project.id)
                                                                    }
                                                                    className="btn-secondary px-3 py-2 text-sm"
                                                                >
                                                                    Add Workflow
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr key={`${project.id}-expanded`}>
                                                        <td colSpan={5} className="bg-slate-50/70">
                                                            {project.workflows.length === 0 ? (
                                                                <div className="empty-state">
                                                                    This project does not have any workflows yet.
                                                                </div>
                                                            ) : (
                                                                <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                                                                    {project.workflows.map((workflow) => (
                                                                        <article
                                                                            key={workflow.id}
                                                                            className="surface-card-strong p-4"
                                                                        >
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div>
                                                                                    <p className="text-sm font-semibold text-slate-950">
                                                                                        {workflow.name}
                                                                                    </p>
                                                                                    <p className="mt-1 text-sm text-slate-500">
                                                                                        Last changed{' '}
                                                                                        {formatTimestamp(
                                                                                            workflow.updated_at,
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                                <StatusBadge
                                                                                    tone={workflowTone(
                                                                                        workflow.status,
                                                                                    )}
                                                                                >
                                                                                    {workflow.status}
                                                                                </StatusBadge>
                                                                            </div>
                                                                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                                                                <StatusBadge tone="brand">
                                                                                    {workflow.latest_version
                                                                                        ? `v${workflow.latest_version.version_number}`
                                                                                        : 'No version'}
                                                                                </StatusBadge>
                                                                                {workflow.published_version_id && (
                                                                                    <StatusBadge tone="success">
                                                                                        Live
                                                                                    </StatusBadge>
                                                                                )}
                                                                            </div>
                                                                            <div className="mt-4">
                                                                                <Link
                                                                                    href={route('workflows.editor', {
                                                                                        workflow: workflow.id,
                                                                                    })}
                                                                                    className="btn-primary px-4 py-3 text-sm"
                                                                                >
                                                                                    Open Editor
                                                                                </Link>
                                                                            </div>
                                                                        </article>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}

                                    {filteredProjects.length === 0 && (
                                        <tr>
                                            <td colSpan={5}>
                                                <div className="empty-state my-3">
                                                    No projects match the current filters.
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <ActivityFeed
                        items={recentActivity}
                        className="rail-card"
                        emptyMessage="Project and workflow changes will appear here once activity starts flowing."
                    />
                </div>
            </div>

            <Modal show={projectModalOpen} onClose={closeProjectModal} maxWidth="lg">
                <form onSubmit={createProject} className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="eyebrow">Create Project</p>
                        <h2 className="panel-title mt-2">Provision a new project workspace</h2>
                        <p className="mt-3 text-sm text-slate-600">
                            Create a project shell first, then attach workflows and versioned process maps.
                        </p>
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                        Project Name
                        <input
                            value={projectName}
                            onChange={(event) => setProjectName(event.target.value)}
                            required
                            disabled={!canManageProjects || pendingProject}
                            className="input-shell mt-2"
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Description
                        <textarea
                            value={projectDescription}
                            onChange={(event) => setProjectDescription(event.target.value)}
                            disabled={!canManageProjects || pendingProject}
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
                            disabled={!canManageProjects || pendingProject}
                            className="btn-primary px-4 py-3 text-sm"
                        >
                            Create Project
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal show={workflowModalOpen} onClose={closeWorkflowModal} maxWidth="lg">
                <form onSubmit={createWorkflow} className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="eyebrow">Create Workflow</p>
                        <h2 className="panel-title mt-2">Open a new process model</h2>
                        <p className="mt-3 text-sm text-slate-600">
                            New workflows start in draft mode with an initial version ready for editing.
                        </p>
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                        Project
                        <select
                            value={selectedProjectId ?? ''}
                            onChange={(event) =>
                                setSelectedProjectId(Number(event.target.value))
                            }
                            disabled={!canEditWorkflows || pendingWorkflow || projects.length === 0}
                            className="select-shell mt-2"
                        >
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Workflow Name
                        <input
                            value={workflowName}
                            onChange={(event) => setWorkflowName(event.target.value)}
                            required
                            disabled={!canEditWorkflows || pendingWorkflow || !selectedProjectId}
                            className="input-shell mt-2"
                        />
                    </label>

                    {workflowError && (
                        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {workflowError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeWorkflowModal}
                            className="btn-ghost px-4 py-3 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                pendingWorkflow ||
                                !selectedProjectId ||
                                !canEditWorkflows ||
                                projects.length === 0
                            }
                            className="btn-primary px-4 py-3 text-sm"
                        >
                            Create Workflow
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
