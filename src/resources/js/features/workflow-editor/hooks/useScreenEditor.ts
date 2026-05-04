import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Screen, ScreenCustomField } from '@/types/processAtlas';
import type { DrawingTool } from '../components/inspector/drawing';
import { DEFAULT_DRAWING_COLOR, DEFAULT_STROKE_WIDTH } from '../components/inspector/drawing';
import type { FieldEditorMode, WorkflowNodeData } from '../types';
import { resolveApiError } from '@/shared/lib/apiErrors';
import { useAutosave } from '@/hooks/useAutosave';
import { processAtlasApi } from '@/shared/api/processAtlasApi';

interface UseScreenEditorOptions {
    screens: Screen[];
    selectedNodeId: string | null;
    latestRevisionId: number | null;
    canEdit: boolean;
    setScreens: React.Dispatch<React.SetStateAction<Screen[]>>;
    setActionError: (error: string | null) => void;
    setActionNotice: (notice: string | null) => void;
    updateNodeData: (nodeId: string, patch: Partial<WorkflowNodeData>) => void;
}

interface UseScreenEditorReturn {
    selectedScreen: Screen | null;
    isSavingScreen: boolean;
    title: string;
    setTitle: (title: string) => void;
    subtitle: string;
    setSubtitle: (subtitle: string) => void;
    note: string;
    setNote: (note: string) => void;
    imageFile: File | null;
    setImageFile: (file: File | null) => void;
    drawingJson: string;
    setDrawingJson: (json: string) => void;
    drawingChanged: boolean;
    setDrawingChanged: (changed: boolean) => void;
    drawingTool: DrawingTool;
    setDrawingTool: (tool: DrawingTool) => void;
    drawingColor: string;
    setDrawingColor: (color: string) => void;
    drawingStrokeWidth: number;
    setDrawingStrokeWidth: (width: number) => void;
    fieldEditorMode: FieldEditorMode;
    editingFieldId: number | null;
    newCustomKey: string;
    newCustomValue: string;
    newCustomFieldType: ScreenCustomField['field_type'];
    editingField: ScreenCustomField | null;
    setFieldEditorMode: (mode: FieldEditorMode) => void;
    setEditingFieldId: (id: number | null) => void;
    setNewCustomKey: (key: string) => void;
    setNewCustomValue: (value: string) => void;
    setNewCustomFieldType: (type: ScreenCustomField['field_type']) => void;
    saveScreenData: () => Promise<Screen | null>;
    saveDrawing: (
        canvasRef: React.RefObject<{
            getShapesJson: () => string;
            getPngBlob: () => Promise<Blob | null>;
        }>
    ) => Promise<void>;
    saveDrawingDirect: (json: string, blob: Blob | null) => Promise<void>;
    upsertScreen: (event: React.FormEvent) => Promise<void>;
    upsertCustomField: () => Promise<void>;
    submitFieldEditor: (event: React.FormEvent) => Promise<void>;
    removeCustomField: (fieldId: number) => Promise<boolean>;
    resetFieldDraft: () => void;
    closeFieldEditor: () => void;
    openCreateFieldEditor: () => void;
    openEditFieldEditor: (field: ScreenCustomField) => void;
}

export function useScreenEditor({
    screens,
    selectedNodeId,
    latestRevisionId,
    canEdit,
    setScreens,
    setActionError,
    setActionNotice,
    updateNodeData,
}: UseScreenEditorOptions): UseScreenEditorReturn {
    const [isSavingScreen, setIsSavingScreen] = useState(false);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [note, setNote] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [drawingJson, setDrawingJson] = useState('');
    const [drawingChanged, setDrawingChanged] = useState(false);
    const [drawingTool, setDrawingTool] = useState<DrawingTool>('pen');
    const [drawingColor, setDrawingColor] = useState(DEFAULT_DRAWING_COLOR);
    const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
    const [fieldEditorMode, setFieldEditorMode] = useState<FieldEditorMode>('hidden');
    const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
    const [newCustomKey, setNewCustomKey] = useState('');
    const [newCustomValue, setNewCustomValue] = useState('');
    const [newCustomFieldType, setNewCustomFieldType] =
        useState<ScreenCustomField['field_type']>('text');
    const clearScreenAutosaveRef = useRef<(() => void) | null>(null);

    const selectedScreen = useMemo(
        () => screens.find(screen => screen.node_id === selectedNodeId) ?? null,
        [screens, selectedNodeId]
    );

    const editingField = editingFieldId
        ? (selectedScreen?.custom_fields.find(field => field.id === editingFieldId) ?? null)
        : null;

    const lastSavedScreenRef = useRef<{
        title: string;
        subtitle: string;
        note: string;
        drawingJson: string;
        nodeId: string | null;
    }>({ title: '', subtitle: '', note: '', drawingJson: '', nodeId: null });

    // Sync form state when selected screen changes
    useEffect(() => {
        clearScreenAutosaveRef.current?.();
        lastSavedScreenRef.current = {
            title: selectedScreen?.title ?? '',
            subtitle: selectedScreen?.subtitle ?? '',
            note: selectedScreen?.note ?? '',
            drawingJson: selectedScreen?.drawing_json ?? '',
            nodeId: selectedScreen?.node_id ?? null,
        };
        setTitle(selectedScreen?.title ?? '');
        setSubtitle(selectedScreen?.subtitle ?? '');
        setNote(selectedScreen?.note ?? '');
        setImageFile(null);
        setDrawingJson(selectedScreen?.drawing_json ?? '');
        setDrawingChanged(false);
        setDrawingTool('pen');
        setDrawingColor(DEFAULT_DRAWING_COLOR);
        setDrawingStrokeWidth(DEFAULT_STROKE_WIDTH);
    }, [selectedScreen]);

    const resetFieldDraft = useCallback(() => {
        setEditingFieldId(null);
        setNewCustomKey('');
        setNewCustomValue('');
        setNewCustomFieldType('text');
    }, []);

    const closeFieldEditor = useCallback(() => {
        setFieldEditorMode('hidden');
        resetFieldDraft();
    }, [resetFieldDraft]);

    const openCreateFieldEditor = useCallback(() => {
        resetFieldDraft();
        setFieldEditorMode('create');
        setActionError(null);
        setActionNotice(null);
    }, [resetFieldDraft, setActionError, setActionNotice]);

    const openEditFieldEditor = useCallback(
        (field: ScreenCustomField) => {
            setEditingFieldId(field.id);
            setNewCustomKey(field.key);
            setNewCustomValue(field.value ?? '');
            setNewCustomFieldType(field.field_type);
            setFieldEditorMode('edit');
            setActionError(null);
            setActionNotice(null);
        },
        [setActionError, setActionNotice]
    );

    const buildFormData = useCallback((): FormData => {
        const form = new FormData();
        form.append('workflow_revision_id', String(latestRevisionId));
        form.append('node_id', selectedNodeId ?? '');
        form.append('title', title);
        form.append('subtitle', subtitle);
        form.append('note', note);
        if (imageFile) form.append('image', imageFile);
        if (drawingJson) form.append('drawing_json', drawingJson);

        return form;
    }, [latestRevisionId, selectedNodeId, title, subtitle, note, imageFile, drawingJson]);

    const saveScreenData = useCallback(async (): Promise<Screen | null> => {
        if (!latestRevisionId || !selectedNodeId) {
            return null;
        }

        const form = buildFormData();

        const response = await processAtlasApi.screens.upsert(form);

        const updatedScreen: Screen = response.data.data;

        setScreens(current => {
            const withoutUpdated = current.filter(screen => screen.id !== updatedScreen.id);
            return [...withoutUpdated, updatedScreen];
        });

        updateNodeData(updatedScreen.node_id, {
            label: updatedScreen.title,
            subtitle: updatedScreen.subtitle ?? '',
            image_url: updatedScreen.image_url ?? null,
            drawing_image_url: updatedScreen.drawing_image_url ?? null,
        });

        return updatedScreen;
    }, [latestRevisionId, selectedNodeId, buildFormData, setScreens, updateNodeData]);

    const saveDrawing = useCallback(
        async (
            canvasRef: React.RefObject<{
                getShapesJson: () => string;
                getPngBlob: () => Promise<Blob | null>;
            }>
        ) => {
            if (!latestRevisionId || !selectedNodeId || !canEdit) {
                return;
            }

            setIsSavingScreen(true);
            setActionError(null);

            try {
                const currentJson = canvasRef.current?.getShapesJson() ?? '';
                const pngBlob = await canvasRef.current?.getPngBlob();

                const form = buildFormData();
                if (currentJson) form.set('drawing_json', currentJson);
                if (pngBlob) {
                    form.append('drawing_image', pngBlob, 'drawing.png');
                }

                const response = await processAtlasApi.screens.upsert(form);
                const updatedScreen: Screen = response.data.data;

                setScreens(current => {
                    const withoutUpdated = current.filter(screen => screen.id !== updatedScreen.id);
                    return [...withoutUpdated, updatedScreen];
                });

                updateNodeData(updatedScreen.node_id, {
                    label: updatedScreen.title,
                    subtitle: updatedScreen.subtitle ?? '',
                    image_url: updatedScreen.image_url ?? null,
                    drawing_image_url: updatedScreen.drawing_image_url ?? null,
                });

                lastSavedScreenRef.current = {
                    ...lastSavedScreenRef.current,
                    drawingJson: currentJson,
                };
                setDrawingJson(currentJson);
                setDrawingChanged(false);
                setActionNotice('Drawing saved.');
            } catch (error) {
                setActionError(resolveApiError(error, 'Drawing save failed.'));
            } finally {
                setIsSavingScreen(false);
            }
        },
        [
            latestRevisionId,
            selectedNodeId,
            canEdit,
            buildFormData,
            setScreens,
            updateNodeData,
            setActionError,
            setActionNotice,
        ]
    );

    const saveDrawingDirect = useCallback(
        async (json: string, blob: Blob | null) => {
            if (!latestRevisionId || !selectedNodeId || !canEdit) {
                return;
            }

            setIsSavingScreen(true);
            setActionError(null);

            try {
                const form = buildFormData();
                if (json) form.set('drawing_json', json);
                if (blob) {
                    form.append('drawing_image', blob, 'drawing.png');
                }

                const response = await processAtlasApi.screens.upsert(form);
                const updatedScreen: Screen = response.data.data;

                setScreens(current => {
                    const withoutUpdated = current.filter(screen => screen.id !== updatedScreen.id);
                    return [...withoutUpdated, updatedScreen];
                });

                updateNodeData(updatedScreen.node_id, {
                    label: updatedScreen.title,
                    subtitle: updatedScreen.subtitle ?? '',
                    image_url: updatedScreen.image_url ?? null,
                    drawing_image_url: updatedScreen.drawing_image_url ?? null,
                });

                lastSavedScreenRef.current = {
                    ...lastSavedScreenRef.current,
                    drawingJson: json,
                };
                setDrawingJson(json);
                setDrawingChanged(false);
                setActionNotice('Drawing saved.');
            } catch (error) {
                console.error('[saveDrawingDirect] error:', error);
                setActionError(resolveApiError(error, 'Drawing save failed.'));
            } finally {
                setIsSavingScreen(false);
            }
        },
        [
            latestRevisionId,
            selectedNodeId,
            canEdit,
            buildFormData,
            setScreens,
            updateNodeData,
            setActionError,
            setActionNotice,
        ]
    );

    const { clearTimer: clearScreenAutosave } = useAutosave({
        saveFn: async () => {
            if (!latestRevisionId || !selectedNodeId || !canEdit) {
                return;
            }

            const last = lastSavedScreenRef.current;
            if (
                title === last.title &&
                subtitle === last.subtitle &&
                note === last.note &&
                selectedNodeId === last.nodeId
            ) {
                return;
            }

            setIsSavingScreen(true);
            setActionError(null);

            try {
                await saveScreenData();
                lastSavedScreenRef.current = {
                    title,
                    subtitle,
                    note,
                    drawingJson: lastSavedScreenRef.current.drawingJson,
                    nodeId: selectedNodeId,
                };
                setActionNotice('Screen metadata autosaved.');
            } catch (error) {
                setActionError(resolveApiError(error, 'Screen autosave failed.'));
                throw error;
            } finally {
                setIsSavingScreen(false);
            }
        },
        dependencies: [title, subtitle, note],
        delay: 1000,
        enabled: canEdit && selectedNodeId !== null,
    });

    clearScreenAutosaveRef.current = clearScreenAutosave;

    const upsertScreen = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault();

            if (!canEdit) {
                setActionError('You do not have permission to edit this workflow.');
                return;
            }

            setIsSavingScreen(true);
            setActionError(null);

            try {
                await saveScreenData();
                setActionNotice('Screen metadata saved.');
            } catch (error) {
                setActionError(resolveApiError(error, 'Screen metadata could not be saved.'));
            } finally {
                setIsSavingScreen(false);
            }
        },
        [canEdit, saveScreenData, setActionError, setActionNotice]
    );

    const upsertCustomField = useCallback(async () => {
        if (!newCustomKey.trim()) {
            return;
        }

        try {
            const screen = selectedScreen ?? (await saveScreenData());
            if (!screen) {
                return;
            }

            const response = await processAtlasApi.screens.upsertCustomField(screen.id, {
                key: newCustomKey,
                value: newCustomValue || null,
                field_type: newCustomFieldType,
            });

            const field = response.data.data as ScreenCustomField;

            setScreens(current =>
                current.map(item => {
                    if (item.id !== screen.id) {
                        return item;
                    }

                    const withoutCurrent = item.custom_fields.filter(
                        customField => customField.id !== field.id
                    );

                    return {
                        ...item,
                        custom_fields: [...withoutCurrent, field],
                    };
                })
            );

            setNewCustomKey('');
            setNewCustomValue('');
            setNewCustomFieldType('text');
            setActionNotice('Custom field saved.');
            closeFieldEditor();
        } catch (error) {
            setActionError(resolveApiError(error, 'The custom field could not be saved.'));
        }
    }, [
        newCustomKey,
        newCustomValue,
        newCustomFieldType,
        selectedScreen,
        saveScreenData,
        setScreens,
        closeFieldEditor,
        setActionError,
        setActionNotice,
    ]);

    const submitFieldEditor = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault();

            if (!canEdit || !newCustomKey.trim()) {
                return;
            }

            if (fieldEditorMode === 'edit' && editingField) {
                if (!selectedScreen) {
                    return;
                }

                try {
                    const response = await processAtlasApi.screens.upsertCustomField(
                        selectedScreen.id,
                        {
                            key: newCustomKey,
                            value: newCustomValue || null,
                            field_type: newCustomFieldType,
                            sort_order: editingField.sort_order,
                        }
                    );

                    const updated = response.data.data as ScreenCustomField;

                    if (updated.id !== editingField.id) {
                        await processAtlasApi.screens.deleteCustomField(editingField.id);
                    }

                    setScreens(current =>
                        current.map(screen => ({
                            ...screen,
                            custom_fields: screen.custom_fields
                                .filter(item => item.id !== editingField.id)
                                .filter(item => item.id !== updated.id)
                                .concat(updated),
                        }))
                    );

                    setActionNotice('Custom field saved.');
                    closeFieldEditor();
                } catch (error) {
                    setActionError(
                        resolveApiError(error, 'The custom field could not be updated.')
                    );
                }

                return;
            }

            await upsertCustomField();
        },
        [
            canEdit,
            newCustomKey,
            newCustomValue,
            newCustomFieldType,
            fieldEditorMode,
            editingField,
            selectedScreen,
            setScreens,
            closeFieldEditor,
            setActionError,
            setActionNotice,
            upsertCustomField,
        ]
    );

    const removeCustomField = useCallback(
        async (fieldId: number): Promise<boolean> => {
            try {
                await processAtlasApi.screens.deleteCustomField(fieldId);

                setScreens(current =>
                    current.map(screen => ({
                        ...screen,
                        custom_fields: screen.custom_fields.filter(item => item.id !== fieldId),
                    }))
                );

                return true;
            } catch {
                return false;
            }
        },
        [setScreens]
    );

    return {
        selectedScreen,
        isSavingScreen,
        title,
        setTitle,
        subtitle,
        setSubtitle,
        note,
        setNote,
        imageFile,
        setImageFile,
        drawingJson,
        setDrawingJson,
        drawingChanged,
        setDrawingChanged,
        drawingTool,
        setDrawingTool,
        drawingColor,
        setDrawingColor,
        drawingStrokeWidth,
        setDrawingStrokeWidth,
        fieldEditorMode,
        editingFieldId,
        newCustomKey,
        newCustomValue,
        newCustomFieldType,
        editingField,
        setFieldEditorMode,
        setEditingFieldId,
        setNewCustomKey,
        setNewCustomValue,
        setNewCustomFieldType,
        saveScreenData,
        saveDrawing,
        saveDrawingDirect,
        upsertScreen,
        upsertCustomField,
        submitFieldEditor,
        removeCustomField,
        resetFieldDraft,
        closeFieldEditor,
        openCreateFieldEditor,
        openEditFieldEditor,
    };
}
