import { useState, useCallback } from 'react';
import type { DrawingTool } from '../components/inspector/drawing';
import { DEFAULT_DRAWING_COLOR, DEFAULT_STROKE_WIDTH } from '../components/inspector/drawing';
import { useEditorStore } from '../stores/editorStore';
import { useUpsertScreen } from '@/shared/api/useScreenQueries';
import { resolveApiError } from '@/shared/lib/apiErrors';

export function useScreenDrawing() {
    const [drawingJson, setDrawingJson] = useState('');
    const [drawingChanged, setDrawingChanged] = useState(false);
    const [drawingTool, setDrawingTool] = useState<DrawingTool>('pen');
    const [drawingColor, setDrawingColor] = useState(DEFAULT_DRAWING_COLOR);
    const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
    const [isSaving, setIsSaving] = useState(false);

    const screens = useEditorStore(state => state.screens);
    const selectedNodeId = useEditorStore(state => state.selectedNodeId);
    const latestRevisionId = useEditorStore(state => state.activeRevisionId);
    const canEdit = useEditorStore(state => state.canEditWorkflows);
    const setScreens = useEditorStore(state => state.setScreens);
    const setActionError = useEditorStore(state => state.setActionError);
    const setActionNotice = useEditorStore(state => state.setActionNotice);

    const upsertScreenMutation = useUpsertScreen();

    const selectedScreen = selectedNodeId
        ? (screens.find(screen => screen.node_id === selectedNodeId) ?? null)
        : null;

    const buildFormData = useCallback((): FormData => {
        const form = new FormData();
        form.append('workflow_revision_id', String(latestRevisionId));
        form.append('node_id', selectedNodeId ?? '');
        form.append('title', selectedScreen?.title ?? '');
        form.append('subtitle', selectedScreen?.subtitle ?? '');
        form.append('note', selectedScreen?.note ?? '');
        if (drawingJson) form.append('drawing_json', drawingJson);
        return form;
    }, [latestRevisionId, selectedNodeId, selectedScreen, drawingJson]);

    const saveDrawing = useCallback(
        async (
            canvasRef: React.RefObject<{
                getShapesJson: () => string;
                getPngBlob: () => Promise<Blob | null>;
            }>
        ) => {
            if (!latestRevisionId || !selectedNodeId || !canEdit) return;

            setIsSaving(true);
            setActionError(null);

            try {
                const currentJson = canvasRef.current?.getShapesJson() ?? '';
                const pngBlob = await canvasRef.current?.getPngBlob();

                const form = buildFormData();
                if (currentJson) form.set('drawing_json', currentJson);
                if (pngBlob) {
                    form.append('drawing_image', pngBlob, 'drawing.png');
                }

                const response = await upsertScreenMutation.mutateAsync(form);
                const updatedScreen = response.data.data;

                setScreens(current => {
                    const withoutUpdated = current.filter(screen => screen.id !== updatedScreen.id);
                    return [...withoutUpdated, updatedScreen];
                });

                setDrawingJson(currentJson);
                setDrawingChanged(false);
                setActionNotice('Drawing saved.');
            } catch (error) {
                setActionError(resolveApiError(error, 'Drawing save failed.'));
            } finally {
                setIsSaving(false);
            }
        },
        [
            latestRevisionId,
            selectedNodeId,
            canEdit,
            buildFormData,
            upsertScreenMutation,
            setScreens,
            setActionError,
            setActionNotice,
        ]
    );

    const saveDrawingDirect = useCallback(
        async (json: string, blob: Blob | null) => {
            if (!latestRevisionId || !selectedNodeId || !canEdit) return;

            setIsSaving(true);
            setActionError(null);

            try {
                const form = buildFormData();
                if (json) form.set('drawing_json', json);
                if (blob) {
                    form.append('drawing_image', blob, 'drawing.png');
                }

                const response = await upsertScreenMutation.mutateAsync(form);
                const updatedScreen = response.data.data;

                setScreens(current => {
                    const withoutUpdated = current.filter(screen => screen.id !== updatedScreen.id);
                    return [...withoutUpdated, updatedScreen];
                });

                setDrawingJson(json);
                setDrawingChanged(false);
                setActionNotice('Drawing saved.');
            } catch (error) {
                console.error('[saveDrawingDirect] error:', error);
                setActionError(resolveApiError(error, 'Drawing save failed.'));
            } finally {
                setIsSaving(false);
            }
        },
        [
            latestRevisionId,
            selectedNodeId,
            canEdit,
            buildFormData,
            upsertScreenMutation,
            setScreens,
            setActionError,
            setActionNotice,
        ]
    );

    return {
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
        isSaving,
        saveDrawing,
        saveDrawingDirect,
    };
}
