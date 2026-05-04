import { useCallback, useRef } from 'react';
import { useSaveGraph } from '@/shared/api/useWorkflowQueries';
import { useEditorStore } from '../stores/editorStore';
import { useAutosave } from '@/hooks/useAutosave';

interface UseEditorPersistenceOptions {
    latestRevisionId: number | null;
    canEdit: boolean;
    nodes: unknown[];
    edges: unknown[];
    lockVersion: number;
    dirtyCounter: number;
    onLockVersionChange: (lockVersion: number) => void;
}

export function useEditorPersistence({
    latestRevisionId,
    canEdit,
    nodes,
    edges,
    lockVersion,
    dirtyCounter,
    onLockVersionChange,
}: UseEditorPersistenceOptions) {
    const saveGraphMutation = useSaveGraph();
    const isSavingRef = useRef(false);
    const setGraphState = useEditorStore(state => state.setGraphState);
    const setGraphMessage = useEditorStore(state => state.setGraphMessage);
    const setLastSavedAt = useEditorStore(state => state.setLastSavedAt);
    const setActionError = useEditorStore(state => state.setActionError);
    const setActionNotice = useEditorStore(state => state.setActionNotice);

    const saveGraph = useCallback(
        async (source: 'ui' | 'autosave' = 'ui') => {
            if (!latestRevisionId || !canEdit) return;
            if (isSavingRef.current) return;

            isSavingRef.current = true;
            setGraphState('saving');
            setGraphMessage(
                source === 'autosave' ? 'Autosaving canvas…' : 'Saving current canvas state.'
            );

            try {
                const response = await saveGraphMutation.mutateAsync({
                    revisionId: latestRevisionId,
                    graphJson: { nodes, edges },
                    lockVersion,
                    source,
                });

                onLockVersionChange(response.data.data.lock_version);
                setGraphState('saved');
                setGraphMessage(
                    source === 'autosave'
                        ? 'Canvas autosaved.'
                        : 'Canvas state saved to the current draft.'
                );
                setLastSavedAt(new Date().toISOString());
                setActionNotice(
                    source === 'autosave'
                        ? 'Canvas autosaved.'
                        : 'Canvas state saved to the current draft.'
                );
            } catch (error) {
                const err = error as {
                    response?: { status?: number; data?: { message?: string } };
                };
                const isConflict = err.response?.status === 409;
                const message = isConflict
                    ? 'A revision conflict occurred. Refresh and retry.'
                    : 'Graph save failed. Refresh and retry.';

                setGraphState(isConflict ? 'conflict' : 'error');
                setGraphMessage(message);
                setActionError(message);
                throw error;
            } finally {
                isSavingRef.current = false;
            }
        },
        [
            latestRevisionId,
            canEdit,
            nodes,
            edges,
            lockVersion,
            onLockVersionChange,
            saveGraphMutation,
            setGraphState,
            setGraphMessage,
            setLastSavedAt,
            setActionError,
            setActionNotice,
        ]
    );

    const { clearTimer } = useAutosave({
        saveFn: async () => {
            await saveGraph('autosave');
        },
        dependencies: [dirtyCounter],
        delay: 5000,
        minInterval: 15000,
        enabled: canEdit,
    });

    const markGraphSaved = useCallback(
        (message: string) => {
            setGraphState('saved');
            setGraphMessage(message);
        },
        [setGraphState, setGraphMessage]
    );

    return {
        saveGraph,
        markGraphSaved,
        clearAutosave: clearTimer,
    };
}
