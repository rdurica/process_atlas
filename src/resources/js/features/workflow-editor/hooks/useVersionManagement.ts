import { useCallback, useState } from 'react';
import type { WorkflowRevisionSummary } from '@/types/processAtlas';
import { processAtlasApi } from '@/shared/api/processAtlasApi';

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
            await processAtlasApi.revisions.switchToDraft(revision.id);
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
                const response = await processAtlasApi.revisions.get(revision.id);
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
