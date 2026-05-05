import { useCallback } from 'react';
import {
    useCreateRevision,
    usePublishRevision,
    useDeleteRevision,
    useSwitchToDraft,
    useSaveDraftName,
} from '@/shared/api/useWorkflowQueries';
import { useEditorStore } from '../stores/editorStore';
import type { WorkflowRevisionSummary } from '@/types/processAtlas';

export function useRevisionActions() {
    const createRevisionMutation = useCreateRevision();
    const publishRevisionMutation = usePublishRevision();
    const deleteRevisionMutation = useDeleteRevision();
    const switchToDraftMutation = useSwitchToDraft();
    const saveDraftNameMutation = useSaveDraftName();

    const setActionError = useEditorStore(state => state.setActionError);
    const setActionNotice = useEditorStore(state => state.setActionNotice);
    const setIsRunningAction = useEditorStore(state => state.setIsRunningAction);

    const runAction = useCallback(
        async (task: () => Promise<void>, successMessage: string) => {
            setIsRunningAction(true);
            setActionError(null);
            try {
                await task();
                setActionNotice(successMessage);
            } catch (error) {
                setActionError('The workflow action failed.');
                throw error;
            } finally {
                setIsRunningAction(false);
            }
        },
        [setActionError, setActionNotice, setIsRunningAction]
    );

    const createDraft = useCallback(
        async (workflowId: string, draftName?: string, sourceRevisionId?: string) => {
            await runAction(
                () =>
                    createRevisionMutation
                        .mutateAsync({
                            workflowId,
                            draftName,
                            sourceRevisionId,
                        })
                        .then(() => undefined),
                'A new draft was created.'
            );
        },
        [createRevisionMutation, runAction]
    );

    const publishCurrent = useCallback(
        async (revisionId: string, force = false) => {
            await runAction(
                () =>
                    publishRevisionMutation
                        .mutateAsync({ revisionId, force })
                        .then(() => undefined),
                'The current revision was published.'
            );
        },
        [publishRevisionMutation, runAction]
    );

    const deleteRevision = useCallback(
        async (revision: WorkflowRevisionSummary) => {
            await runAction(
                () => deleteRevisionMutation.mutateAsync(revision.id).then(() => undefined),
                revision.draft_name ?? `rev. ${revision.revision_number} was deleted.`
            );
        },
        [deleteRevisionMutation, runAction]
    );

    const switchToDraft = useCallback(
        async (revisionId: string) => {
            await runAction(
                () => switchToDraftMutation.mutateAsync(revisionId).then(() => undefined),
                'Switched to draft.'
            );
        },
        [switchToDraftMutation, runAction]
    );

    const saveDraftName = useCallback(
        async (revisionId: string, name: string) => {
            if (!name) return;
            await runAction(
                () =>
                    saveDraftNameMutation
                        .mutateAsync({ revisionId, draftName: name })
                        .then(() => undefined),
                'Draft name saved.'
            );
        },
        [saveDraftNameMutation, runAction]
    );

    return {
        createDraft,
        publishCurrent,
        deleteRevision,
        switchToDraft,
        saveDraftName,
        isLoading:
            createRevisionMutation.isPending ||
            publishRevisionMutation.isPending ||
            deleteRevisionMutation.isPending ||
            switchToDraftMutation.isPending ||
            saveDraftNameMutation.isPending,
    };
}
