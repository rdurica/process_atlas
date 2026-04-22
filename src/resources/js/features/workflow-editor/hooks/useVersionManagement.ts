import { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import type { WorkflowVersionSummary } from '@/types/processAtlas';

interface UseVersionManagementOptions {
    workflowId: number;
    versions: WorkflowVersionSummary[];
    latestVersion: WorkflowVersionSummary | null;
    canEditInProject: boolean;
    canPublish: boolean;
}

interface UseVersionManagementReturn {
    versions: WorkflowVersionSummary[];
    previewVersion: WorkflowVersionSummary | null;
    rollbackVersionId: number | null;
    isRunningAction: boolean;
    setPreviewVersion: (version: WorkflowVersionSummary | null) => void;
    setRollbackVersionId: (id: number | null) => void;
    createDraft: () => Promise<void>;
    publishCurrent: () => Promise<void>;
    rollback: () => Promise<void>;
    deleteVersion: (version: WorkflowVersionSummary) => Promise<void>;
    handleVersionTimelineClick: (version: WorkflowVersionSummary) => Promise<void>;
    selectedRollbackVersion: WorkflowVersionSummary | null;
    reloadWorkflow: () => void;
    runWorkflowAction: (task: () => Promise<void>, _successMessage: string) => Promise<void>;
}

export function useVersionManagement({
    workflowId,
    versions,
    latestVersion,
    canEditInProject,
    canPublish,
}: UseVersionManagementOptions): UseVersionManagementReturn {
    const [previewVersion, setPreviewVersion] = useState<WorkflowVersionSummary | null>(null);
    const [rollbackVersionId, setRollbackVersionId] = useState<number | null>(
        versions.find(v => v.id !== latestVersion?.id)?.id ?? null
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
            await window.axios.post(`/api/v1/workflows/${workflowId}/versions`);
        }, 'A new draft revision was created.');
    }, [workflowId, canEditInProject, runWorkflowAction]);

    const publishCurrent = useCallback(async () => {
        if (!latestVersion || !canPublish) return;
        await runWorkflowAction(async () => {
            await window.axios.post(`/api/v1/workflow-versions/${latestVersion.id}/publish`);
        }, 'The current revision was published.');
    }, [latestVersion, canPublish, runWorkflowAction]);

    const rollback = useCallback(async () => {
        if (!rollbackVersionId || !canPublish) return;
        await runWorkflowAction(async () => {
            await window.axios.post(`/api/v1/workflows/${workflowId}/rollback`, {
                to_version_id: rollbackVersionId,
            });
        }, 'A rollback draft was created from the selected revision.');
    }, [workflowId, rollbackVersionId, canPublish, runWorkflowAction]);

    const deleteVersion = useCallback(
        async (version: WorkflowVersionSummary) => {
            await runWorkflowAction(async () => {
                await window.axios.delete(`/api/v1/workflow-versions/${version.id}`);
            }, `rev. ${version.version_number} was deleted.`);
        },
        [runWorkflowAction]
    );

    const handleVersionTimelineClick = useCallback(
        async (version: WorkflowVersionSummary) => {
            setRollbackVersionId(version.id);

            if (latestVersion && version.id === latestVersion.id) {
                setPreviewVersion(null);
                return;
            }

            try {
                const response = await window.axios.get<{ data: WorkflowVersionSummary }>(
                    `/api/v1/workflow-versions/${version.id}`
                );
                setPreviewVersion(response.data.data);
            } catch {
                // silently ignore preview fetch errors
            }
        },
        [latestVersion]
    );

    const selectedRollbackVersion = versions.find(v => v.id === rollbackVersionId) ?? null;

    return {
        versions,
        previewVersion,
        rollbackVersionId,
        isRunningAction,
        setPreviewVersion,
        setRollbackVersionId,
        createDraft,
        publishCurrent,
        rollback,
        deleteVersion,
        handleVersionTimelineClick,
        selectedRollbackVersion,
        reloadWorkflow,
        runWorkflowAction,
    };
}
