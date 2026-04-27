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
    isRunningAction: boolean;
    setPreviewRevision: (revision: WorkflowRevisionSummary | null) => void;
    createDraft: (draftName?: string, sourceRevisionId?: number) => Promise<void>;
    publishCurrent: (force?: boolean) => Promise<void>;
    deleteRevision: (revision: WorkflowRevisionSummary) => Promise<void>;
    handleRevisionTimelineClick: (revision: WorkflowRevisionSummary) => Promise<void>;
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

    const createDraft = useCallback(
        async (draftName?: string, sourceRevisionId?: number) => {
            if (!canEditInProject) return;
            await runWorkflowAction(async () => {
                await window.axios.post(`/api/v1/workflows/${workflowId}/revisions`, {
                    draft_name: draftName || undefined,
                    source_revision_id: sourceRevisionId,
                });
            }, 'A new draft was created.');
        },
        [workflowId, canEditInProject, runWorkflowAction]
    );

    const publishCurrent = useCallback(
        async (force = false) => {
            if (!latestRevision || !canPublish) return;
            await runWorkflowAction(async () => {
                await window.axios.post(`/api/v1/workflow-revisions/${latestRevision.id}/publish`, {
                    force,
                });
            }, 'The current draft was published.');
        },
        [latestRevision, canPublish, runWorkflowAction]
    );

    const deleteRevision = useCallback(
        async (revision: WorkflowRevisionSummary) => {
            await runWorkflowAction(
                async () => {
                    await window.axios.delete(`/api/v1/workflow-revisions/${revision.id}`);
                },
                revision.draft_name ?? `rev. ${revision.revision_number} was deleted.`
            );
        },
        [runWorkflowAction]
    );

    const switchToDraft = useCallback(
        async (revision: WorkflowRevisionSummary) => {
            if (!canEditInProject) return;
            await runWorkflowAction(async () => {
                await window.axios.post(
                    `/api/v1/workflow-revisions/${revision.id}/switch-to-draft`
                );
            }, 'Switched to draft.');
        },
        [canEditInProject, runWorkflowAction]
    );

    const handleRevisionTimelineClick = useCallback(
        async (revision: WorkflowRevisionSummary) => {
            if (latestRevision && revision.id === latestRevision.id) {
                setPreviewRevision(null);
                return;
            }

            if (!revision.is_published) {
                await switchToDraft(revision);
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
        [latestRevision, switchToDraft]
    );

    return {
        revisions,
        previewRevision,
        isRunningAction,
        setPreviewRevision,
        createDraft,
        publishCurrent,
        deleteRevision,
        handleRevisionTimelineClick,
        reloadWorkflow,
        runWorkflowAction,
    };
}
