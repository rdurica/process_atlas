import { useCallback, useState } from 'react';
import type { WorkflowRevisionSummary } from '@/types/processAtlas';

interface UseVersionManagementOptions {
    latestRevision: WorkflowRevisionSummary | null;
    canEditInProject: boolean;
    canPublish: boolean;
}

interface UseVersionManagementReturn {
    previewRevision: WorkflowRevisionSummary | null;
    setPreviewRevision: (revision: WorkflowRevisionSummary | null) => void;
    switchToDraft: (revision: WorkflowRevisionSummary) => Promise<void>;
    handleRevisionTimelineClick: (revision: WorkflowRevisionSummary) => Promise<void>;
}

export function useVersionManagement({
    latestRevision,
    canEditInProject,
}: UseVersionManagementOptions): UseVersionManagementReturn {
    const [previewRevision, setPreviewRevision] = useState<WorkflowRevisionSummary | null>(null);

    const switchToDraft = useCallback(
        async (revision: WorkflowRevisionSummary) => {
            if (!canEditInProject) return;
            await window.axios.post(`/api/v1/workflow-revisions/${revision.id}/switch-to-draft`);
        },
        [canEditInProject]
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
        previewRevision,
        setPreviewRevision,
        switchToDraft,
        handleRevisionTimelineClick,
    };
}
