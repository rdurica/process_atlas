import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { ProjectRole, WorkflowSummary } from '@/types/processAtlas';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

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

function canArchiveInProject(role: ProjectRole | null): boolean {
    return role === 'process_owner';
}

export default function ProjectWorkflows({ project, workflows }: ProjectWorkflowsProps) {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [query, setQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [archivedWorkflows, setArchivedWorkflows] = useState<WorkflowSummary[]>([]);
    const [loadingArchived, setLoadingArchived] = useState(false);

    const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
    const [workflowName, setWorkflowName] = useState('');
    const [pendingWorkflow, setPendingWorkflow] = useState(false);
    const [workflowError, setWorkflowError] = useState<string | null>(null);

    const [confirmArchiveId, setConfirmArchiveId] = useState<number | null>(null);
    const [pendingArchive, setPendingArchive] = useState(false);
    const [archiveError, setArchiveError] = useState<string | null>(null);

    useEffect(() => {
        if (!showArchived) {
            setArchivedWorkflows([]);
            return;
        }

        setLoadingArchived(true);
        window.axios
            .get(`/api/v1/projects/${project.id}/workflows?include_archived=1`)
            .then(response => {
                const all: WorkflowSummary[] = response.data?.data ?? [];
                const archived = all.filter((w: WorkflowSummary) => w.archived_at);
                setArchivedWorkflows(archived);
            })
            .catch(() => {
                setArchivedWorkflows([]);
            })
            .finally(() => {
                setLoadingArchived(false);
            });
    }, [showArchived, project.id]);

    const activeWorkflows = useMemo(() => workflows, [workflows]);

    const displayedWorkflows = useMemo(() => {
        const source = showArchived ? [...activeWorkflows, ...archivedWorkflows] : activeWorkflows;
        const normalizedQuery = query.trim().toLowerCase();

        return source.filter(workflow => {
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
    }, [activeWorkflows, archivedWorkflows, query, statusFilter, showArchived]);

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

    const archiveWorkflow = async (workflowId: number) => {
        setPendingArchive(true);
        setArchiveError(null);

        try {
            await window.axios.post(`/api/v1/workflows/${workflowId}/archive`);
            setConfirmArchiveId(null);
            router.reload({ only: ['workflows', 'project'] });
        } catch (error) {
            setArchiveError(resolveApiError(error, 'The workflow could not be archived.'));
        } finally {
            setPendingArchive(false);
        }
    };

    const unarchiveWorkflow = async (workflowId: number) => {
        setPendingArchive(true);
        setArchiveError(null);

        try {
            await window.axios.post(`/api/v1/workflows/${workflowId}/unarchive`);
            setArchivedWorkflows(prev => prev.filter(w => w.id !== workflowId));
            router.reload({ only: ['workflows', 'project'] });
        } catch (error) {
            setArchiveError(resolveApiError(error, 'The workflow could not be unarchived.'));
        } finally {
            setPendingArchive(false);
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
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={showArchived}
                                    onChange={event => setShowArchived(event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Show archived
                            </label>
                        </div>
                    </div>

                    <div className="overflow-x-auto px-6 pb-6">
                        {displayedWorkflows.length === 0 ? (
                            <div className="empty-state py-12">
                                {workflows.length === 0 && !showArchived
                                    ? 'This project does not have any workflows yet.'
                                    : 'No workflows match the current filters.'}
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200/70">
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Name
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Version
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Status
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Last Updated
                                        </th>
                                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {displayedWorkflows.map(workflow => {
                                        const isArchived = !!workflow.archived_at;
                                        return (
                                            <tr
                                                key={workflow.id}
                                                className={`group transition-colors hover:bg-slate-50/80 ${isArchived ? 'bg-slate-50/40' : ''}`}
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <p
                                                            className={`font-semibold ${isArchived ? 'text-slate-500' : 'text-slate-950'}`}
                                                        >
                                                            {workflow.name}
                                                        </p>
                                                        {isArchived && (
                                                            <StatusBadge tone="neutral">
                                                                Archived
                                                            </StatusBadge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <StatusBadge
                                                            tone={isArchived ? 'neutral' : 'brand'}
                                                        >
                                                            {workflow.latest_version
                                                                ? `rev. ${workflow.latest_version.version_number}`
                                                                : 'No revision'}
                                                        </StatusBadge>
                                                        {workflow.published_version_id &&
                                                            !isArchived && (
                                                                <StatusBadge tone="success">
                                                                    Live
                                                                </StatusBadge>
                                                            )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge
                                                        tone={
                                                            isArchived
                                                                ? 'neutral'
                                                                : workflowTone(workflow.status)
                                                        }
                                                    >
                                                        {workflow.status}
                                                    </StatusBadge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm text-slate-500">
                                                        {formatTimestamp(workflow.updated_at)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('workflows.editor', {
                                                                workflow: workflow.id,
                                                            })}
                                                            className="btn-secondary px-3 py-1.5 text-xs"
                                                        >
                                                            Open Editor
                                                        </Link>
                                                        {canArchiveInProject(
                                                            project.current_user_role
                                                        ) && (
                                                            <>
                                                                {isArchived ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            unarchiveWorkflow(
                                                                                workflow.id
                                                                            )
                                                                        }
                                                                        disabled={pendingArchive}
                                                                        className="btn-secondary px-3 py-1.5 text-xs"
                                                                    >
                                                                        Unarchive
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setConfirmArchiveId(
                                                                                workflow.id
                                                                            )
                                                                        }
                                                                        className="btn-secondary px-3 py-1.5 text-xs text-rose-700 hover:border-rose-300 hover:bg-rose-50"
                                                                    >
                                                                        Archive
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        {loadingArchived && (
                            <p className="py-4 text-center text-sm text-slate-500">
                                Loading archived workflows…
                            </p>
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
                            Create
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Archive Modal */}
            <Modal
                show={confirmArchiveId !== null}
                onClose={() => setConfirmArchiveId(null)}
                maxWidth="md"
            >
                <div className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="eyebrow">Archive Workflow</p>
                        <h2 className="panel-title mt-2">Are you sure?</h2>
                        <p className="mt-3 text-sm text-slate-600">
                            Archiving will hide this workflow from the default list. It will remain
                            accessible in read-only mode.
                        </p>
                    </div>

                    {archiveError && (
                        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {archiveError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setConfirmArchiveId(null)}
                            className="btn-ghost px-4 py-3 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={pendingArchive}
                            onClick={() => {
                                if (confirmArchiveId) {
                                    archiveWorkflow(confirmArchiveId);
                                }
                            }}
                            className="btn-primary bg-rose-600 px-4 py-3 text-sm hover:bg-rose-700"
                        >
                            Archive
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
