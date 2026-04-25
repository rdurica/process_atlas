import { useCallback, useState } from 'react';
import type { Screen, ScreenCustomField } from '@/types/processAtlas';
import type { FieldEditorMode } from '../types';

interface UseScreenEditorOptions {
    screens: Screen[];
    latestRevisionId: number | null;
    canEdit: boolean;
    onScreenUpdate: (updatedScreen: Screen) => void;
    onNodesUpdate: (nodeId: string, data: Record<string, unknown>) => void;
}

interface UseScreenEditorReturn {
    selectedScreen: Screen | null;
    isSavingScreen: boolean;
    fieldEditorMode: FieldEditorMode;
    editingFieldId: number | null;
    newCustomKey: string;
    newCustomValue: string;
    newCustomFieldType: ScreenCustomField['field_type'];
    editingField: ScreenCustomField | null;
    setScreens: React.Dispatch<React.SetStateAction<Screen[]>>;
    setSelectedScreen: (screen: Screen | null) => void;
    setIsSavingScreen: (saving: boolean) => void;
    setFieldEditorMode: (mode: FieldEditorMode) => void;
    setEditingFieldId: (id: number | null) => void;
    setNewCustomKey: (key: string) => void;
    setNewCustomValue: (value: string) => void;
    setNewCustomFieldType: (type: ScreenCustomField['field_type']) => void;
    saveScreenData: (
        nodeId: string,
        title: string,
        subtitle: string,
        description: string,
        imageFile: File | null
    ) => Promise<Screen | null>;
    upsertCustomField: (
        key: string,
        value: string | null,
        fieldType: ScreenCustomField['field_type']
    ) => Promise<void>;
    submitFieldEditor: (
        key: string,
        value: string | null,
        fieldType: ScreenCustomField['field_type'],
        sortOrder: number | null
    ) => Promise<void>;
    removeCustomField: (fieldId: number) => Promise<boolean>;
    resetFieldDraft: () => void;
    closeFieldEditor: () => void;
    openCreateFieldEditor: () => void;
    openEditFieldEditor: (field: ScreenCustomField) => void;
}

export function useScreenEditor({
    screens,
    latestRevisionId,
    canEdit,
    onScreenUpdate,
    onNodesUpdate,
}: UseScreenEditorOptions): UseScreenEditorReturn {
    const [isSavingScreen, setIsSavingScreen] = useState(false);
    const [fieldEditorMode, setFieldEditorMode] = useState<FieldEditorMode>('hidden');
    const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
    const [newCustomKey, setNewCustomKey] = useState('');
    const [newCustomValue, setNewCustomValue] = useState('');
    const [newCustomFieldType, setNewCustomFieldType] =
        useState<ScreenCustomField['field_type']>('text');

    const selectedScreen = screens.length > 0 ? screens[0] : null;

    const editingField = editingFieldId
        ? (selectedScreen?.custom_fields.find(field => field.id === editingFieldId) ?? null)
        : null;

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
    }, [resetFieldDraft]);

    const openEditFieldEditor = useCallback((field: ScreenCustomField) => {
        setEditingFieldId(field.id);
        setNewCustomKey(field.key);
        setNewCustomValue(field.value ?? '');
        setNewCustomFieldType(field.field_type);
        setFieldEditorMode('edit');
    }, []);

    const setScreens = useCallback(
        (updater: React.SetStateAction<Screen[]>) => {
            if (typeof updater === 'function') {
                const newScreens = updater(screens);
                if (newScreens.length > 0) {
                    onScreenUpdate(newScreens[0]);
                }
            }
        },
        [screens, onScreenUpdate]
    );

    const setSelectedScreen = useCallback(
        (screen: Screen | null) => {
            if (screen) {
                onScreenUpdate(screen);
            }
        },
        [onScreenUpdate]
    );

    const saveScreenData = useCallback(
        async (
            nodeId: string,
            title: string,
            subtitle: string,
            description: string,
            imageFile: File | null
        ): Promise<Screen | null> => {
            if (!latestRevisionId || !canEdit) return null;

            const form = new FormData();
            form.append('workflow_revision_id', String(latestRevisionId));
            form.append('node_id', nodeId);
            form.append('title', title);
            form.append('subtitle', subtitle);
            form.append('description', description);
            if (imageFile) form.append('image', imageFile);

            const response = await window.axios.post('/api/v1/screens/upsert', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const updatedScreen: Screen = response.data.data;
            onScreenUpdate(updatedScreen);
            onNodesUpdate(nodeId, {
                label: updatedScreen.title || nodeId,
                subtitle: updatedScreen.subtitle ?? '',
                image_url: updatedScreen.image_url ?? null,
            });

            return updatedScreen;
        },
        [latestRevisionId, canEdit, onScreenUpdate, onNodesUpdate]
    );

    const upsertCustomField = useCallback(
        async (key: string, value: string | null, fieldType: ScreenCustomField['field_type']) => {
            if (!selectedScreen || !key.trim()) return;

            const response = await window.axios.post(
                `/api/v1/screens/${selectedScreen.id}/custom-fields/upsert`,
                { key, value, field_type: fieldType }
            );

            const field = response.data.data as ScreenCustomField;

            setScreens(current =>
                current.map(screen => {
                    if (screen.id !== selectedScreen.id) return screen;
                    return {
                        ...screen,
                        custom_fields: [...screen.custom_fields, field],
                    };
                })
            );
        },
        [selectedScreen, setScreens]
    );

    const submitFieldEditor = useCallback(
        async (
            key: string,
            value: string | null,
            fieldType: ScreenCustomField['field_type'],
            sortOrder: number | null
        ) => {
            if (!selectedScreen || !key.trim()) return;

            const response = await window.axios.post(
                `/api/v1/screens/${selectedScreen.id}/custom-fields/upsert`,
                { key, value, field_type: fieldType, sort_order: sortOrder }
            );

            const updated = response.data.data as ScreenCustomField;

            if (editingFieldId && updated.id !== editingFieldId) {
                await window.axios.delete(`/api/v1/custom-fields/${editingFieldId}`);
            }

            setScreens(current =>
                current.map(screen => ({
                    ...screen,
                    custom_fields: screen.custom_fields
                        .filter(item => item.id !== editingFieldId)
                        .filter(item => item.id !== updated.id)
                        .concat(updated),
                }))
            );

            closeFieldEditor();
        },
        [selectedScreen, editingFieldId, setScreens, closeFieldEditor]
    );

    const removeCustomField = useCallback(
        async (fieldId: number): Promise<boolean> => {
            try {
                await window.axios.delete(`/api/v1/custom-fields/${fieldId}`);

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
        fieldEditorMode,
        editingFieldId,
        newCustomKey,
        newCustomValue,
        newCustomFieldType,
        editingField,
        setScreens: () => {},
        setSelectedScreen,
        setIsSavingScreen,
        setFieldEditorMode,
        setEditingFieldId,
        setNewCustomKey,
        setNewCustomValue,
        setNewCustomFieldType,
        saveScreenData,
        upsertCustomField,
        submitFieldEditor,
        removeCustomField,
        resetFieldDraft,
        closeFieldEditor,
        openCreateFieldEditor,
        openEditFieldEditor,
    };
}
