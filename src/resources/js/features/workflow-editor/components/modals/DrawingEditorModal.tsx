import { useRef, useState } from 'react';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';

import {
    DrawingCanvas,
    DrawingToolbar,
} from '@/features/workflow-editor/components/inspector/drawing';
import type { DrawingCanvasRef } from '@/features/workflow-editor/components/inspector/drawing/DrawingCanvas';
import type { DrawingTool } from '@/features/workflow-editor/components/inspector/drawing/types';
import {
    DEFAULT_DRAWING_COLOR,
    DEFAULT_STROKE_WIDTH,
} from '@/features/workflow-editor/components/inspector/drawing/types';

interface DrawingEditorModalProps {
    open: boolean;
    onClose: () => void;
    initialShapesJson: string | null;
    onSave: (shapesJson: string, pngBlob: Blob | null) => void;
    canEdit: boolean;
}

export default function DrawingEditorModal({
    open,
    onClose,
    initialShapesJson,
    onSave,
    canEdit,
}: DrawingEditorModalProps) {
    const canvasRef = useRef<DrawingCanvasRef>(null);
    const [tool, setTool] = useState<DrawingTool>('select');
    const [color, setColor] = useState(DEFAULT_DRAWING_COLOR);
    const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
    const [hasChanges, setHasChanges] = useState(false);

    const handleSave = async () => {
        if (!canvasRef.current) return;
        const json = canvasRef.current.getShapesJson();
        const blob = await canvasRef.current.getPngBlob();
        onSave(json, blob);
    };

    return (
        <Modal show={open} maxWidth="full" onClose={onClose}>
            <div className="flex h-[85vh] flex-col">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <span className="text-base font-semibold text-foreground">Drawing Editor</span>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden p-6">
                    <div className="w-56 shrink-0 overflow-y-auto">
                        <DrawingToolbar
                            tool={tool}
                            onToolChange={setTool}
                            color={color}
                            onColorChange={setColor}
                            strokeWidth={strokeWidth}
                            onStrokeWidthChange={setStrokeWidth}
                            canUndo={canvasRef.current?.canUndo ?? false}
                            canRedo={canvasRef.current?.canRedo ?? false}
                            onUndo={() => canvasRef.current?.undo()}
                            onRedo={() => canvasRef.current?.redo()}
                            onClear={() => canvasRef.current?.clear()}
                            canDelete={tool === 'select'}
                            onDelete={() => canvasRef.current?.deleteSelected()}
                        />
                    </div>

                    <div className="flex flex-1 items-center justify-center overflow-auto">
                        <div className="h-full max-h-[720px] w-full max-w-[400px]">
                            <DrawingCanvas
                                ref={canvasRef}
                                tool={tool}
                                color={color}
                                strokeWidth={strokeWidth}
                                fontSize={14}
                                initialShapesJson={initialShapesJson}
                                onChange={() => setHasChanges(true)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                        {hasChanges ? 'Unsaved changes' : 'Saved'}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={!canEdit}
                        >
                            Cancel
                        </Button>
                        <Button type="button" size="sm" onClick={handleSave} disabled={!canEdit}>
                            Save Drawing
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
