import { router } from '@inertiajs/react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WorkflowSummary } from '@/types/processAtlas';
import { processAtlasApi } from '@/shared/api/processAtlasApi';
import { resolveApiError } from '@/shared/lib/apiErrors';
import type { ProjectWorkflowsProps, WorkflowStatusFilter } from './types';

export function workflowTone(status: WorkflowSummary['status']) {
    return status === 'published' ? 'success' : 'warning';
}

export function useProjectWorkflows({
    project,
    workflows,
    current_page,
    last_page,
}: ProjectWorkflowsProps) {
    const [statusFilter, setStatusFilter] = useState<WorkflowStatusFilter>('all');
    const [query, setQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
    const [workflowName, setWorkflowName] = useState('');
    const [pendingWorkflow, setPendingWorkflow] = useState(false);
    const [workflowError, setWorkflowError] = useState<string | null>(null);

    const [confirmArchiveId, setConfirmArchiveId] = useState<number | null>(null);
    const [pendingArchive, setPendingArchive] = useState(false);
    const [archiveError, setArchiveError] = useState<string | null>(null);

    const isArchived = project.archived_at !== null;

    const isFirstSearchEffect = useRef(true);

    const reloadWithParams = useCallback(
        (
            newPage?: number,
            newSearch?: string,
            newStatus?: WorkflowStatusFilter,
            newArchived?: boolean
        ) => {
            router.reload({
                only: ['workflows', 'project', 'current_page', 'last_page', 'total', 'from', 'to'],
                data: {
                    page: newPage ?? current_page,
                    search: newSearch ?? query,
                    status: newStatus ?? statusFilter,
                    include_archived: (newArchived ?? showArchived) ? 1 : undefined,
                },
            });
        },
        [current_page, query, statusFilter, showArchived]
    );

    const handlePageChange = (newPage: number) => {
        reloadWithParams(newPage);
    };

    const handleSearchChange = (value: string) => {
        setQuery(value);
    };

    useEffect(() => {
        if (isFirstSearchEffect.current) {
            isFirstSearchEffect.current = false;
            return;
        }

        const timer = setTimeout(() => {
            reloadWithParams(1, query);
        }, 400);

        return () => clearTimeout(timer);
    }, [query, reloadWithParams]);

    const handleStatusChange = (value: WorkflowStatusFilter) => {
        setStatusFilter(value);
        reloadWithParams(1, undefined, value);
    };

    const handleArchivedChange = (value: boolean) => {
        setShowArchived(value);
        reloadWithParams(1, undefined, undefined, value);
    };

    const displayedWorkflows = useMemo(() => workflows, [workflows]);

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

            router.reload({ only: ['workflows', 'project'] });
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
            router.reload({ only: ['workflows', 'project'] });
        } catch (error) {
            setArchiveError(resolveApiError(error, 'The workflow could not be unarchived.'));
        } finally {
            setPendingArchive(false);
        }
    };

    return {
        statusFilter,
        setStatusFilter: handleStatusChange,
        query,
        setQuery: handleSearchChange,
        showArchived,
        setShowArchived: handleArchivedChange,
        displayedWorkflows,
        currentPage: current_page,
        lastPage: last_page,
        isArchived,
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
        handlePageChange,
    };
}
