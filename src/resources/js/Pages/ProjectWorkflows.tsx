import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { ProjectRole, WorkflowSummary } from '@/types/processAtlas';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

type ProjectWorkflowsProps = {
    project: {
        id: number;
        name: string;
        description?: string | null;
        workflows_count: number;
        current_user_role: ProjectRole | null;
    };
    workflows: WorkflowSummary[];
};

type StatusFilter = 'all' | 'draft' | 'published' | 'empty';

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

function canEditInProject(role: ProjectRole | null): boolean {
    return role === 'process_owner' || role === 'editor';
}

export default function ProjectWorkflows({ project, workflows }: ProjectWorkflowsProps) {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [query, setQuery] = useState('');
    const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
    const [workflowName, setWorkflowName] = useState('');
    const [pendingWorkflow, setPendingWorkflow] = useState(false);
    const [workflowError, setWorkflowError] = useState<string | null>(null);

    const filteredWorkflows = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return workflows.filter(workflow => {
            const matchesQuery =
                normalizedQuery.length === 0 ||
                workflow.name.toLowerCase().includes(normalizedQuery);

            if (!matchesQuery) {
                return false;
            }

            if (statusFilter === 'all') {
                return true;
            }

            return workflow.status === statusFilter;
        });
    }, [workflows, query, statusFilter]);

    const closeWorkflowModal = () => {
        setWorkflowModalOpen(false);
        setWorkflowError(null);
        setWorkflowName('');
    };

    const createWorkflow = async (event: FormEvent) => {
        event.preventDefault();

        setPendingWorkflow(true);
        setWorkflowError(null);

        try {
            const response = await window.axios.post(`/api/v1/projects/${project.id}/workflows`, {
                name: workflowName,
            });

            const workflowId = response.data?.data?.id;
            closeWorkflowModal();

            if (workflowId) {
                window.location.href = route('workflows.editor', {
                    workflow: workflowId,
                });
                return;
            }

            router.reload({ only: ['workflows'] });
        } catch (error) {
            setWorkflowError(resolveApiError(error, 'The workflow could not be created.'));
        } finally {
            setPendingWorkflow(false);
        }
    };

    return (
        <AuthenticatedLayout
            contentWidth="wide"
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="eyebrow">
                            <Link href={route('dashboard')} className="hover:text-slate-900">
                                Projects
                            </Link>
                            {' / '}
                            {project.name}
                        </p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                            {project.name}
                        </h1>
                        {project.description && (
                            <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {canEditInProject(project.current_user_role) && (
                            <button
                                type="button"
                                onClick={() => setWorkflowModalOpen(true)}
                                className="btn-primary px-4 py-2.5 text-sm"
                            >
                                New Workflow
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={project.name} />

            <div className="space-y-6">
                <section className="surface-card table-shell">
                    <div className="command-bar border-b border-slate-200/70">
                        <div>
                            <p className="eyebrow">Workflows</p>
                            <h2 className="panel-title mt-2">{project.name}</h2>
                        </div>

                        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                            <div className="min-w-[260px] lg:w-[320px]">
                                <input
                                    value={query}
                                    onChange={event => setQuery(event.target.value)}
                                    placeholder="Search workflows"
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
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {filteredWorkflows.length === 0 ? (
                            <div className="empty-state py-12">
                                {workflows.length === 0
                                    ? 'This project does not have any workflows yet.'
                                    : 'No workflows match the current filters.'}
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {filteredWorkflows.map(workflow => (
                                    <div
                                        key={workflow.id}
                                        className="group relative rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-base font-semibold text-slate-950">
                                                    {workflow.name}
                                                </h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {formatTimestamp(workflow.updated_at)}
                                                </p>
                                            </div>
                                            <StatusBadge tone={workflowTone(workflow.status)}>
                                                {workflow.status}
                                            </StatusBadge>
                                        </div>

                                        <div className="mt-4 flex items-center gap-2">
                                            <StatusBadge tone="brand">
                                                {workflow.latest_version
                                                    ? `rev. ${workflow.latest_version.version_number}`
                                                    : 'No revision'}
                                            </StatusBadge>
                                            {workflow.published_version_id && (
                                                <StatusBadge tone="success">Live</StatusBadge>
                                            )}
                                        </div>

                                        <div className="mt-4 flex items-center gap-2">
                                            <Link
                                                href={route('workflows.editor', {
                                                    workflow: workflow.id,
                                                })}
                                                className="btn-secondary w-full justify-center px-3 py-2 text-sm"
                                            >
                                                Open Editor
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Create Workflow Modal */}
            <Modal show={workflowModalOpen} onClose={closeWorkflowModal} maxWidth="lg">
                <form onSubmit={createWorkflow} className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="eyebrow">Create Workflow</p>
                        <h2 className="panel-title mt-2">Open a new process model</h2>
                        <p className="mt-3 text-sm text-slate-600">
                            New workflows start in draft mode with an initial revision ready for
                            editing.
                        </p>
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                        Workflow Name
                        <input
                            value={workflowName}
                            onChange={event => setWorkflowName(event.target.value)}
                            required
                            disabled={pendingWorkflow}
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
                            disabled={pendingWorkflow}
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
