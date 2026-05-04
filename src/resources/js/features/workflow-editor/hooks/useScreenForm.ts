import { useState, useCallback, useRef, useEffect } from 'react';
import type { Screen } from '@/types/processAtlas';
import { useEditorStore } from '../stores/editorStore';
import { useAutosave } from '@/hooks/useAutosave';
import { useUpsertScreen } from '@/shared/api/useScreenQueries';
import { resolveApiError } from '@/shared/lib/apiErrors';

export function useScreenForm() {
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const screens = useEditorStore(state => state.screens);
    const setScreens = useEditorStore(state => state.setScreens);
    const selectedNodeId = useEditorStore(state => state.selectedNodeId);
    const latestRevisionId = useEditorStore(state => state.activeRevisionId);
    const canEdit = useEditorStore(state => state.canEditWorkflows);
    const setActionError = useEditorStore(state => state.setActionError);
    const setActionNotice = useEditorStore(state => state.setActionNotice);

    const upsertScreenMutation = useUpsertScreen();

    const selectedScreen = selectedNodeId
        ? (screens.find(screen => screen.node_id === selectedNodeId) ?? null)
        : null;

    const lastSavedRef = useRef({ title: '', subtitle: '', note: '', nodeId: '' as string | null });

    // Sync form state when selected screen changes
    useEffect(() => {
        lastSavedRef.current = {
            title: selectedScreen?.title ?? '',
            subtitle: selectedScreen?.subtitle ?? '',
            note: selectedScreen?.note ?? '',
            nodeId: selectedScreen?.node_id ?? null,
        };
        setTitle(selectedScreen?.title ?? '');
        setSubtitle(selectedScreen?.subtitle ?? '');
        setNote(selectedScreen?.note ?? '');
    }, [selectedScreen]);

    const buildFormData = useCallback((): FormData => {
        const form = new FormData();
        form.append('workflow_revision_id', String(latestRevisionId));
        form.append('node_id', selectedNodeId ?? '');
        form.append('title', title);
        form.append('subtitle', subtitle);
        form.append('note', note);
        return form;
    }, [latestRevisionId, selectedNodeId, title, subtitle, note]);

    const saveScreenData = useCallback(
        async (formOverride?: FormData): Promise<Screen | null> => {
            if (!latestRevisionId || !selectedNodeId) return null;

            const form = formOverride ?? buildFormData();
            const response = await upsertScreenMutation.mutateAsync(form);
            const updatedScreen: Screen = response.data.data;

            setScreens(current => {
                const withoutUpdated = current.filter(screen => screen.id !== updatedScreen.id);
                return [...withoutUpdated, updatedScreen];
            });

            return updatedScreen;
        },
        [latestRevisionId, selectedNodeId, buildFormData, upsertScreenMutation, setScreens]
    );

    const { clearTimer: clearAutosave } = useAutosave({
        saveFn: async () => {
            if (!latestRevisionId || !selectedNodeId || !canEdit) return;

            const last = lastSavedRef.current;
            if (
                title === last.title &&
                subtitle === last.subtitle &&
                note === last.note &&
                selectedNodeId === last.nodeId
            ) {
                return;
            }

            setIsSaving(true);
            setActionError(null);
            try {
                await saveScreenData();
                lastSavedRef.current = { title, subtitle, note, nodeId: selectedNodeId };
                setActionNotice('Screen metadata autosaved.');
            } catch (error) {
                setActionError(resolveApiError(error, 'Screen autosave failed.'));
                throw error;
            } finally {
                setIsSaving(false);
            }
        },
        dependencies: [title, subtitle, note],
        delay: 1000,
        enabled: canEdit && selectedNodeId !== null,
    });

    const upsertScreen = useCallback(
        async (event: React.FormEvent, formOverride?: FormData) => {
            event.preventDefault();
            if (!canEdit) {
                setActionError('You do not have permission to edit this workflow.');
                return;
            }

            setIsSaving(true);
            setActionError(null);
            try {
                const updatedScreen = await saveScreenData(formOverride);
                setActionNotice('Screen metadata saved.');
                return updatedScreen;
            } catch (error) {
                setActionError(resolveApiError(error, 'Screen metadata could not be saved.'));
                return null;
            } finally {
                setIsSaving(false);
            }
        },
        [canEdit, saveScreenData, setActionError, setActionNotice]
    );

    return {
        title,
        setTitle,
        subtitle,
        setSubtitle,
        note,
        setNote,
        isSaving,
        selectedScreen,
        saveScreenData,
        upsertScreen,
        clearAutosave,
        buildFormData,
    };
}
