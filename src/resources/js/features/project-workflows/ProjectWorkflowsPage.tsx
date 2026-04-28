import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { canArchiveInProject, canEditInProject } from '@/shared/lib/projectPermissions';
import { formatDateTime } from '@/shared/lib/dates';
import { Head, Link } from '@inertiajs/react';
import {
    useProjectWorkflows,
    workflowTone,
} from '@/features/project-workflows/useProjectWorkflows';
import type { ProjectWorkflowsProps, WorkflowStatusFilter } from './types';

export default function ProjectWorkflowsPage(props: ProjectWorkflowsProps) {
    const { project, workflows } = props;
    const page = useProjectWorkflows(props);

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
                                onClick={() => page.setWorkflowModalOpen(true)}
                                className="btn-primary px-4 py-2.5 text-sm"
                                data-testid="create-workflow-open"
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
                                    value={page.query}
                                    onChange={event => page.setQuery(event.target.value)}
                                    placeholder="Search workflows"
                                    className="input-shell"
                                />
                            </div>
                            <div className="min-w-[180px]">
                                <select
                                    value={page.statusFilter}
                                    onChange={event =>
                                        page.setStatusFilter(
                                            event.target.value as WorkflowStatusFilter
                                        )
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
                                    checked={page.showArchived}
                                    onChange={event => page.setShowArchived(event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Show archived
                            </label>
                        </div>
                    </div>

                    <div className="overflow-x-auto px-6 pb-6">
                        {page.displayedWorkflows.length === 0 ? (
                            <div className="empty-state py-12">
                                {workflows.length === 0 && !page.showArchived
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
                                            Revision
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
                                    {page.displayedWorkflows.map(workflow => {
                                        const isArchived = !!workflow.archived_at;

                                        return (
                                            <tr
                                                key={workflow.id}
                                                className={`group transition-colors hover:bg-slate-50/80 ${
                                                    isArchived ? 'bg-slate-50/40' : ''
                                                }`}
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <p
                                                            className={`font-semibold ${
                                                                isArchived
                                                                    ? 'text-slate-500'
                                                                    : 'text-slate-950'
                                                            }`}
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
                                                            {workflow.published_revision
                                                                ? `rev. ${workflow.published_revision.revision_number}`
                                                                : 'No revision'}
                                                        </StatusBadge>
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
                                                        {formatDateTime(
                                                            workflow.updated_at,
                                                            'No recent changes'
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('workflows.editor', {
                                                                workflow: workflow.id,
                                                            })}
                                                            className="btn-secondary px-3 py-1.5 text-xs"
                                                            data-testid="open-workflow-editor"
                                                        >
                                                            Open Editor
                                                        </Link>
                                                        {canArchiveInProject(
                                                            project.current_user_role
                                                        ) &&
                                                            (isArchived ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        page.unarchiveWorkflow(
                                                                            workflow.id
                                                                        )
                                                                    }
                                                                    disabled={page.pendingArchive}
                                                                    className="btn-secondary px-3 py-1.5 text-xs"
                                                                >
                                                                    Unarchive
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        page.setConfirmArchiveId(
                                                                            workflow.id
                                                                        )
                                                                    }
                                                                    className="btn-secondary px-3 py-1.5 text-xs text-rose-700 hover:border-rose-300 hover:bg-rose-50"
                                                                >
                                                                    Archive
                                                                </button>
                                                            ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        {page.loadingArchived && (
                            <p className="py-4 text-center text-sm text-slate-500">
                                Loading archived workflows…
                            </p>
                        )}
                    </div>
                </section>
            </div>

            <Modal show={page.workflowModalOpen} onClose={page.closeWorkflowModal} maxWidth="lg">
                <form onSubmit={page.createWorkflow} className="space-y-5 p-6 sm:p-7">
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
                            value={page.workflowName}
                            onChange={event => page.setWorkflowName(event.target.value)}
                            required
                            disabled={page.pendingWorkflow}
                            className="input-shell mt-2"
                            data-testid="workflow-name-input"
                        />
                    </label>

                    {page.workflowError && (
                        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {page.workflowError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={page.closeWorkflowModal}
                            className="btn-ghost px-4 py-3 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={page.pendingWorkflow}
                            className="btn-primary px-4 py-3 text-sm"
                            data-testid="create-workflow-submit"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                show={page.confirmArchiveId !== null}
                onClose={() => page.setConfirmArchiveId(null)}
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

                    {page.archiveError && (
                        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {page.archiveError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => page.setConfirmArchiveId(null)}
                            className="btn-ghost px-4 py-3 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={page.pendingArchive}
                            onClick={() => {
                                if (page.confirmArchiveId) {
                                    page.archiveWorkflow(page.confirmArchiveId);
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
