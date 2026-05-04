import { useCallback, useEffect } from 'react';
import { useScreenForm } from './useScreenForm';
import { useScreenDrawing } from './useScreenDrawing';
import { useScreenImage } from './useScreenImage';
import { useCustomFields } from './useCustomFields';
import { useEditorStore } from '../stores/editorStore';
import type { Screen } from '@/types/processAtlas';

export function useScreenEditor() {
    const form = useScreenForm();
    const drawing = useScreenDrawing();
    const image = useScreenImage();
    const fields = useCustomFields();

    const screens = useEditorStore(state => state.screens);
    const selectedNodeId = useEditorStore(state => state.selectedNodeId);

    const selectedScreen = selectedNodeId
        ? (screens.find(screen => screen.node_id === selectedNodeId) ?? null)
        : null;

    // Reset image file when screen changes
    useEffect(() => {
        image.setImageFile(null);
        drawing.setDrawingJson(selectedScreen?.drawing_json ?? '');
        drawing.setDrawingChanged(false);
        drawing.setDrawingTool('pen');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedScreen?.node_id]);

    const buildScreenFormData = useCallback((): FormData => {
        const formData = form.buildFormData();
        if (image.imageFile) formData.append('image', image.imageFile);
        if (drawing.drawingJson) formData.append('drawing_json', drawing.drawingJson);

        return formData;
    }, [form, image.imageFile, drawing.drawingJson]);

    const saveScreenData = useCallback(async (): Promise<Screen | null> => {
        const updatedScreen = await form.saveScreenData(buildScreenFormData());
        if (updatedScreen && image.imageFile) {
            image.setImageFile(null);
        }

        return updatedScreen;
    }, [form, buildScreenFormData, image]);

    const upsertScreen = useCallback(
        async (event: React.FormEvent) => {
            const updatedScreen = await form.upsertScreen(event, buildScreenFormData());
            if (updatedScreen && image.imageFile) {
                image.setImageFile(null);
            }
        },
        [form, buildScreenFormData, image]
    );

    return {
        selectedScreen,
        isSavingScreen: form.isSaving || drawing.isSaving,
        title: form.title,
        setTitle: form.setTitle,
        subtitle: form.subtitle,
        setSubtitle: form.setSubtitle,
        note: form.note,
        setNote: form.setNote,
        imageFile: image.imageFile,
        setImageFile: image.setImageFile,
        drawingJson: drawing.drawingJson,
        setDrawingJson: drawing.setDrawingJson,
        drawingChanged: drawing.drawingChanged,
        setDrawingChanged: drawing.setDrawingChanged,
        drawingTool: drawing.drawingTool,
        setDrawingTool: drawing.setDrawingTool,
        drawingColor: drawing.drawingColor,
        setDrawingColor: drawing.setDrawingColor,
        drawingStrokeWidth: drawing.drawingStrokeWidth,
        setDrawingStrokeWidth: drawing.setDrawingStrokeWidth,
        fieldEditorMode: fields.fieldEditorMode,
        editingFieldId: fields.editingFieldId,
        newCustomKey: fields.newCustomKey,
        newCustomValue: fields.newCustomValue,
        newCustomFieldType: fields.newCustomFieldType,
        editingField: fields.editingField,
        setFieldEditorMode: fields.setFieldEditorMode,
        setEditingFieldId: fields.setEditingFieldId,
        setNewCustomKey: fields.setNewCustomKey,
        setNewCustomValue: fields.setNewCustomValue,
        setNewCustomFieldType: fields.setNewCustomFieldType,
        saveScreenData,
        saveDrawing: drawing.saveDrawing,
        saveDrawingDirect: drawing.saveDrawingDirect,
        upsertScreen,
        upsertCustomField: fields.upsertCustomField,
        submitFieldEditor: fields.submitFieldEditor,
        removeCustomField: fields.removeCustomField,
        resetFieldDraft: fields.resetFieldDraft,
        closeFieldEditor: fields.closeFieldEditor,
        openCreateFieldEditor: fields.openCreateFieldEditor,
        openEditFieldEditor: fields.openEditFieldEditor,
    };
}
