import { useState, useCallback } from 'react';
import type { ScreenCustomField } from '@/types/processAtlas';
import { useUpsertCustomField, useDeleteCustomField } from '@/shared/api/useScreenQueries';
import { useEditorStore } from '../stores/editorStore';
import { resolveApiError } from '@/shared/lib/apiErrors';

export function useCustomFields() {
    const [fieldEditorMode, setFieldEditorMode] = useState<'hidden' | 'create' | 'edit'>('hidden');
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const [newCustomKey, setNewCustomKey] = useState('');
    const [newCustomValue, setNewCustomValue] = useState('');
    const [newCustomFieldType, setNewCustomFieldType] =
        useState<ScreenCustomField['field_type']>('text');

    const screens = useEditorStore(state => state.screens);
    const setScreens = useEditorStore(state => state.setScreens);
    const setActionError = useEditorStore(state => state.setActionError);
    const setActionNotice = useEditorStore(state => state.setActionNotice);
    const selectedNodeId = useEditorStore(state => state.selectedNodeId);

    const upsertMutation = useUpsertCustomField();
    const deleteMutation = useDeleteCustomField();

    const selectedScreen = selectedNodeId
        ? (screens.find(screen => screen.node_id === selectedNodeId) ?? null)
        : null;

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
        setActionError(null);
    }, [resetFieldDraft, setActionError]);

    const openEditFieldEditor = useCallback(
        (field: ScreenCustomField) => {
            setEditingFieldId(field.id);
            setNewCustomKey(field.key);
            setNewCustomValue(field.value ?? '');
            setNewCustomFieldType(field.field_type);
            setFieldEditorMode('edit');
            setActionError(null);
        },
        [setActionError]
    );

    const upsertCustomField = useCallback(async () => {
        if (!newCustomKey.trim() || !selectedScreen) {
            return;
        }

        try {
            const response = await upsertMutation.mutateAsync({
                screenId: selectedScreen.id,
                payload: {
                    key: newCustomKey,
                    value: newCustomValue || null,
                    field_type: newCustomFieldType,
                },
            });

            const field = response.data.data as ScreenCustomField;

            setScreens(current =>
                current.map(item => {
                    if (item.id !== selectedScreen.id) return item;
                    const withoutCurrent = item.custom_fields.filter(cf => cf.id !== field.id);
                    return { ...item, custom_fields: [...withoutCurrent, field] };
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
        upsertMutation,
        setScreens,
        closeFieldEditor,
        setActionError,
        setActionNotice,
    ]);

    const submitFieldEditor = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault();
            if (!newCustomKey.trim()) return;

            if (fieldEditorMode === 'edit' && editingField && selectedScreen) {
                try {
                    const response = await upsertMutation.mutateAsync({
                        screenId: selectedScreen.id,
                        payload: {
                            key: newCustomKey,
                            value: newCustomValue || null,
                            field_type: newCustomFieldType,
                            sort_order: editingField.sort_order,
                        },
                    });

                    const updated = response.data.data as ScreenCustomField;

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
            newCustomKey,
            newCustomValue,
            newCustomFieldType,
            fieldEditorMode,
            editingField,
            selectedScreen,
            upsertMutation,
            setScreens,
            closeFieldEditor,
            setActionError,
            setActionNotice,
            upsertCustomField,
        ]
    );

    const removeCustomField = useCallback(
        async (fieldId: string): Promise<boolean> => {
            try {
                await deleteMutation.mutateAsync(fieldId);
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
        [deleteMutation, setScreens]
    );

    return {
        fieldEditorMode,
        editingFieldId,
        editingField,
        newCustomKey,
        newCustomValue,
        newCustomFieldType,
        setFieldEditorMode,
        setEditingFieldId,
        setNewCustomKey,
        setNewCustomValue,
        setNewCustomFieldType,
        upsertCustomField,
        submitFieldEditor,
        removeCustomField,
        resetFieldDraft,
        closeFieldEditor,
        openCreateFieldEditor,
        openEditFieldEditor,
    };
}
