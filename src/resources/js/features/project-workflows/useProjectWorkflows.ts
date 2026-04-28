import { router } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { WorkflowSummary } from '@/types/processAtlas';
import { processAtlasApi } from '@/shared/api/processAtlasApi';
import { resolveApiError } from '@/shared/lib/apiErrors';
import type { ProjectWorkflowsProps, WorkflowStatusFilter } from './types';

export function workflowTone(status: WorkflowSummary['status']) {
    return status === 'published' ? 'success' : 'warning';
}

export function useProjectWorkflows({ project, workflows }: ProjectWorkflowsProps) {
    const [statusFilter, setStatusFilter] = useState<WorkflowStatusFilter>('all');
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

        const controller = new AbortController();

        setLoadingArchived(true);
        processAtlasApi.projects
            .workflows(project.id, true, controller.signal)
            .then(response => {
                const archived = response.data.data.filter(workflow => workflow.archived_at);
                setArchivedWorkflows(archived);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setArchivedWorkflows([]);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoadingArchived(false);
                }
            });

        return () => controller.abort();
    }, [showArchived, project.id]);

    const displayedWorkflows = useMemo(() => {
        const source = showArchived ? [...workflows, ...archivedWorkflows] : workflows;
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
    }, [archivedWorkflows, query, showArchived, statusFilter, workflows]);

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
            const response = await processAtlasApi.projects.createWorkflow(project.id, {
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
            await processAtlasApi.workflows.archive(workflowId);
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
            await processAtlasApi.workflows.unarchive(workflowId);
            setArchivedWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId));
            router.reload({ only: ['workflows', 'project'] });
        } catch (error) {
            setArchiveError(resolveApiError(error, 'The workflow could not be unarchived.'));
        } finally {
            setPendingArchive(false);
        }
    };

    return {
        statusFilter,
        setStatusFilter,
        query,
        setQuery,
        showArchived,
        setShowArchived,
        loadingArchived,
        displayedWorkflows,
        workflowModalOpen,
        setWorkflowModalOpen,
        workflowName,
        setWorkflowName,
        pendingWorkflow,
        workflowError,
        closeWorkflowModal,
        createWorkflow,
        confirmArchiveId,
        setConfirmArchiveId,
        pendingArchive,
        archiveError,
        archiveWorkflow,
        unarchiveWorkflow,
    };
}
