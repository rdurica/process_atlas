import { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import type { WorkflowRevisionSummary } from '@/types/processAtlas';

interface UseVersionManagementOptions {
    workflowId: number;
    revisions: WorkflowRevisionSummary[];
    latestRevision: WorkflowRevisionSummary | null;
    canEditInProject: boolean;
    canPublish: boolean;
}

interface UseVersionManagementReturn {
    revisions: WorkflowRevisionSummary[];
    previewRevision: WorkflowRevisionSummary | null;
    rollbackRevisionId: number | null;
    isRunningAction: boolean;
    setPreviewRevision: (revision: WorkflowRevisionSummary | null) => void;
    setRollbackRevisionId: (id: number | null) => void;
    createDraft: () => Promise<void>;
    publishCurrent: () => Promise<void>;
    rollback: () => Promise<void>;
    deleteRevision: (revision: WorkflowRevisionSummary) => Promise<void>;
    handleRevisionTimelineClick: (revision: WorkflowRevisionSummary) => Promise<void>;
    selectedRollbackRevision: WorkflowRevisionSummary | null;
    reloadWorkflow: () => void;
    runWorkflowAction: (task: () => Promise<void>, _successMessage: string) => Promise<void>;
}

export function useVersionManagement({
    workflowId,
    revisions,
    latestRevision,
    canEditInProject,
    canPublish,
}: UseVersionManagementOptions): UseVersionManagementReturn {
    const [previewRevision, setPreviewRevision] = useState<WorkflowRevisionSummary | null>(null);
    const [rollbackRevisionId, setRollbackRevisionId] = useState<number | null>(
        revisions.find(r => r.id !== latestRevision?.id)?.id ?? null
    );
    const [isRunningAction, setIsRunningAction] = useState(false);

    const reloadWorkflow = useCallback(() => {
        router.reload({ only: ['workflow'] });
    }, []);

    const runWorkflowAction = useCallback(
        async (task: () => Promise<void>, _successMessage: string) => {
            setIsRunningAction(true);
            try {
                await task();
                reloadWorkflow();
            } finally {
                setIsRunningAction(false);
            }
        },
        [reloadWorkflow]
    );

    const createDraft = useCallback(async () => {
        if (!canEditInProject) return;
        await runWorkflowAction(async () => {
            await window.axios.post(`/api/v1/workflows/${workflowId}/revisions`);
        }, 'A new draft revision was created.');
    }, [workflowId, canEditInProject, runWorkflowAction]);

    const publishCurrent = useCallback(async () => {
        if (!latestRevision || !canPublish) return;
        await runWorkflowAction(async () => {
            await window.axios.post(`/api/v1/workflow-revisions/${latestRevision.id}/publish`);
        }, 'The current revision was published.');
    }, [latestRevision, canPublish, runWorkflowAction]);

    const rollback = useCallback(async () => {
        if (!rollbackRevisionId || !canPublish) return;
        await runWorkflowAction(async () => {
            await window.axios.post(`/api/v1/workflows/${workflowId}/rollback`, {
                to_version_id: rollbackRevisionId,
            });
        }, 'A rollback draft was created from the selected revision.');
    }, [workflowId, rollbackRevisionId, canPublish, runWorkflowAction]);

    const deleteRevision = useCallback(
        async (revision: WorkflowRevisionSummary) => {
            await runWorkflowAction(async () => {
                await window.axios.delete(`/api/v1/workflow-revisions/${revision.id}`);
            }, `rev. ${revision.revision_number} was deleted.`);
        },
        [runWorkflowAction]
    );

    const handleRevisionTimelineClick = useCallback(
        async (revision: WorkflowRevisionSummary) => {
            setRollbackRevisionId(revision.id);

            if (latestRevision && revision.id === latestRevision.id) {
                setPreviewRevision(null);
                return;
            }

            try {
                const response = await window.axios.get<{ data: WorkflowRevisionSummary }>(
                    `/api/v1/workflow-revisions/${revision.id}`
                );
                setPreviewRevision(response.data.data);
            } catch {
                // silently ignore preview fetch errors
            }
        },
        [latestRevision]
    );

    const selectedRollbackRevision = revisions.find(r => r.id === rollbackRevisionId) ?? null;

    return {
        revisions,
        previewRevision,
        rollbackRevisionId,
        isRunningAction,
        setPreviewRevision,
        setRollbackRevisionId,
        createDraft,
        publishCurrent,
        rollback,
        deleteRevision,
        handleRevisionTimelineClick,
        selectedRollbackRevision,
        reloadWorkflow,
        runWorkflowAction,
    };
}
