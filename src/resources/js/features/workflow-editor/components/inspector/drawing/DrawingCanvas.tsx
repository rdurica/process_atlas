import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import type {
    DrawingTool,
    Shape,
    Point,
    PenShape,
    RectShape,
    CircleShape,
    LineShape,
    TextShape,
} from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './types';
import {
    applyMove,
    applyResize,
    drawSelectionBox,
    generateId,
    getCanvasPoint,
    getHandleAtPoint,
    getHandleCursor,
    getResizeHandles,
    getShapeBounds,
    isPointInShape,
    renderShape,
} from './canvasUtils';

export interface DrawingCanvasRef {
    getShapesJson: () => string;
    getPngBlob: () => Promise<Blob | null>;
    clear: () => void;
    loadShapes: (json: string) => void;
    undo: () => void;
    redo: () => void;
    deleteSelected: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

interface DrawingCanvasProps {
    tool: DrawingTool;
    color: string;
    strokeWidth: number;
    fontSize: number;
    initialShapesJson?: string | null;
    onChange?: () => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
    ({ tool, color, strokeWidth, fontSize, initialShapesJson, onChange }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const shapesRef = useRef<Shape[]>([]);
        const historyRef = useRef<Shape[][]>([]);
        const historyIndexRef = useRef<number>(-1);
        const isDrawingRef = useRef(false);
        const currentShapeRef = useRef<Shape | null>(null);
        const startPointRef = useRef<Point | null>(null);
        const selectedShapeIdRef = useRef<string | null>(null);
        const interactionModeRef = useRef<'none' | 'move' | 'resize'>('none');
        const resizeHandleRef = useRef<string | null>(null);
        const dragStartPointRef = useRef<Point | null>(null);
        const dragStartShapeRef = useRef<Shape | null>(null);
        const [canUndo, setCanUndo] = useState(false);
        const [canRedo, setCanRedo] = useState(false);

        const saveHistory = useCallback(() => {
            const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
            newHistory.push([...shapesRef.current]);
            if (newHistory.length > 50) {
                newHistory.shift();
            }
            historyRef.current = newHistory;
            historyIndexRef.current = newHistory.length - 1;
            setCanUndo(historyIndexRef.current > 0);
            setCanRedo(false);
        }, []);

        const redraw = useCallback(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // White background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Grid pattern (light)
            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 1;
            const gridSize = 20;
            for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, CANVAS_HEIGHT);
                ctx.stroke();
            }
            for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(CANVAS_WIDTH, y);
                ctx.stroke();
            }

            // Render all shapes
            for (const shape of shapesRef.current) {
                renderShape(ctx, shape);
            }

            // Render current shape being drawn
            if (currentShapeRef.current) {
                renderShape(ctx, currentShapeRef.current);
            }

            // Render selection box
            if (selectedShapeIdRef.current) {
                const shape = shapesRef.current.find(s => s.id === selectedShapeIdRef.current);
                if (shape) {
                    const bounds = getShapeBounds(ctx, shape);
                    const handles = getResizeHandles(ctx, shape);
                    drawSelectionBox(ctx, bounds, handles);
                }
            }
        }, []);

        const pushHistoryIfNeeded = useCallback(() => {
            const lastSnapshot = historyRef.current[historyIndexRef.current];
            const currentSnapshot = shapesRef.current;
            const changed =
                !lastSnapshot ||
                lastSnapshot.length !== currentSnapshot.length ||
                JSON.stringify(lastSnapshot) !== JSON.stringify(currentSnapshot);
            if (changed) {
                saveHistory();
                onChange?.();
            }
        }, [saveHistory, onChange]);

        const pushHistoryIfNeededRef = useRef(pushHistoryIfNeeded);
        pushHistoryIfNeededRef.current = pushHistoryIfNeeded;

        const updateCursor = useCallback(
            (event: MouseEvent) => {
                const canvas = canvasRef.current;
                if (!canvas || tool !== 'select') return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                const point = getCanvasPoint(canvas, event);

                if (selectedShapeIdRef.current) {
                    const shape = shapesRef.current.find(s => s.id === selectedShapeIdRef.current);
                    if (shape) {
                        const handle = getHandleAtPoint(ctx, point, shape);
                        if (handle) {
                            canvas.style.cursor = getHandleCursor(handle.id);
                            return;
                        }
                    }
                }

                for (let i = shapesRef.current.length - 1; i >= 0; i--) {
                    if (isPointInShape(ctx, point, shapesRef.current[i])) {
                        canvas.style.cursor = 'move';
                        return;
                    }
                }

                canvas.style.cursor = 'default';
            },
            [tool]
        );

        const handleMouseDown = useCallback(
            (event: MouseEvent | TouchEvent) => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                event.preventDefault();

                const point = getCanvasPoint(canvas, event);

                if (tool === 'select') {
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    // Check resize handles first
                    if (selectedShapeIdRef.current) {
                        const shape = shapesRef.current.find(
                            s => s.id === selectedShapeIdRef.current
                        );
                        if (shape) {
                            const handle = getHandleAtPoint(ctx, point, shape);
                            if (handle) {
                                interactionModeRef.current = 'resize';
                                resizeHandleRef.current = handle.id;
                                dragStartPointRef.current = point;
                                dragStartShapeRef.current = JSON.parse(JSON.stringify(shape));
                                return;
                            }
                        }
                    }

                    // Check shapes (top first)
                    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
                        const shape = shapesRef.current[i];
                        if (isPointInShape(ctx, point, shape)) {
                            selectedShapeIdRef.current = shape.id;
                            interactionModeRef.current = 'move';
                            dragStartPointRef.current = point;
                            dragStartShapeRef.current = JSON.parse(JSON.stringify(shape));
                            redraw();
                            return;
                        }
                    }

                    // Deselect
                    selectedShapeIdRef.current = null;
                    redraw();
                    return;
                }

                isDrawingRef.current = true;
                startPointRef.current = point;

                if (tool === 'pen') {
                    const shape: PenShape = {
                        id: generateId(),
                        type: 'pen',
                        color,
                        strokeWidth,
                        points: [point],
                    };
                    currentShapeRef.current = shape;
                } else if (tool === 'rect') {
                    const shape: RectShape = {
                        id: generateId(),
                        type: 'rect',
                        color,
                        strokeWidth,
                        x: point.x,
                        y: point.y,
                        width: 0,
                        height: 0,
                    };
                    currentShapeRef.current = shape;
                } else if (tool === 'circle') {
                    const shape: CircleShape = {
                        id: generateId(),
                        type: 'circle',
                        color,
                        strokeWidth,
                        x: point.x,
                        y: point.y,
                        radiusX: 0,
                        radiusY: 0,
                    };
                    currentShapeRef.current = shape;
                } else if (tool === 'line') {
                    const shape: LineShape = {
                        id: generateId(),
                        type: 'line',
                        color,
                        strokeWidth,
                        x1: point.x,
                        y1: point.y,
                        x2: point.x,
                        y2: point.y,
                    };
                    currentShapeRef.current = shape;
                }

                redraw();
            },
            [tool, color, strokeWidth, redraw]
        );

        const handleMouseMove = useCallback(
            (event: MouseEvent | TouchEvent) => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                event.preventDefault();

                const point = getCanvasPoint(canvas, event);

                if (tool === 'select') {
                    if (
                        interactionModeRef.current === 'move' &&
                        dragStartShapeRef.current &&
                        dragStartPointRef.current
                    ) {
                        const dx = point.x - dragStartPointRef.current.x;
                        const dy = point.y - dragStartPointRef.current.y;
                        const shape = shapesRef.current.find(
                            s => s.id === selectedShapeIdRef.current
                        );
                        if (shape) {
                            const newShape = JSON.parse(
                                JSON.stringify(dragStartShapeRef.current)
                            ) as Shape;
                            applyMove(newShape, dx, dy);
                            const index = shapesRef.current.findIndex(
                                s => s.id === selectedShapeIdRef.current
                            );
                            if (index !== -1) {
                                shapesRef.current[index] = newShape;
                            }
                            redraw();
                        }
                        return;
                    }

                    if (
                        interactionModeRef.current === 'resize' &&
                        dragStartShapeRef.current &&
                        dragStartPointRef.current &&
                        resizeHandleRef.current
                    ) {
                        const dx = point.x - dragStartPointRef.current.x;
                        const dy = point.y - dragStartPointRef.current.y;
                        const shape = shapesRef.current.find(
                            s => s.id === selectedShapeIdRef.current
                        );
                        if (shape) {
                            const newShape = JSON.parse(
                                JSON.stringify(dragStartShapeRef.current)
                            ) as Shape;
                            applyResize(newShape, resizeHandleRef.current, dx, dy);
                            const index = shapesRef.current.findIndex(
                                s => s.id === selectedShapeIdRef.current
                            );
                            if (index !== -1) {
                                shapesRef.current[index] = newShape;
                            }
                            redraw();
                        }
                        return;
                    }

                    return;
                }

                if (!isDrawingRef.current || !currentShapeRef.current || !startPointRef.current)
                    return;

                const shape = currentShapeRef.current;

                if (shape.type === 'pen') {
                    (shape as PenShape).points.push(point);
                } else if (shape.type === 'rect') {
                    (shape as RectShape).width = point.x - startPointRef.current.x;
                    (shape as RectShape).height = point.y - startPointRef.current.y;
                } else if (shape.type === 'circle') {
                    (shape as CircleShape).radiusX = point.x - startPointRef.current.x;
                    (shape as CircleShape).radiusY = point.y - startPointRef.current.y;
                } else if (shape.type === 'line') {
                    (shape as LineShape).x2 = point.x;
                    (shape as LineShape).y2 = point.y;
                }

                redraw();
            },
            [tool, redraw]
        );

        const handleMouseUp = useCallback(() => {
            if (tool === 'select') {
                if (
                    interactionModeRef.current === 'move' ||
                    interactionModeRef.current === 'resize'
                ) {
                    interactionModeRef.current = 'none';
                    dragStartPointRef.current = null;
                    dragStartShapeRef.current = null;
                    resizeHandleRef.current = null;
                    pushHistoryIfNeeded();
                }
                return;
            }

            if (!isDrawingRef.current || !currentShapeRef.current) return;

            const shape = currentShapeRef.current;

            // Don't add empty shapes
            if (shape.type === 'pen' && (shape as PenShape).points.length < 2) {
                isDrawingRef.current = false;
                currentShapeRef.current = null;
                startPointRef.current = null;
                redraw();
                return;
            }

            if (
                shape.type === 'rect' &&
                Math.abs((shape as RectShape).width) < 2 &&
                Math.abs((shape as RectShape).height) < 2
            ) {
                isDrawingRef.current = false;
                currentShapeRef.current = null;
                startPointRef.current = null;
                redraw();
                return;
            }

            if (
                shape.type === 'circle' &&
                Math.abs((shape as CircleShape).radiusX) < 2 &&
                Math.abs((shape as CircleShape).radiusY) < 2
            ) {
                isDrawingRef.current = false;
                currentShapeRef.current = null;
                startPointRef.current = null;
                redraw();
                return;
            }

            if (
                shape.type === 'line' &&
                Math.abs((shape as LineShape).x2 - (shape as LineShape).x1) < 2 &&
                Math.abs((shape as LineShape).y2 - (shape as LineShape).y1) < 2
            ) {
                isDrawingRef.current = false;
                currentShapeRef.current = null;
                startPointRef.current = null;
                redraw();
                return;
            }

            shapesRef.current.push(shape);
            isDrawingRef.current = false;
            currentShapeRef.current = null;
            startPointRef.current = null;
            redraw();
            pushHistoryIfNeeded();
        }, [tool, redraw, pushHistoryIfNeeded]);

        const handleTextClick = useCallback(
            (event: MouseEvent) => {
                if (tool !== 'text') return;
                const canvas = canvasRef.current;
                if (!canvas) return;

                const point = getCanvasPoint(canvas, event);
                const text = window.prompt('Enter text:');
                if (!text || text.trim() === '') return;

                const shape: TextShape = {
                    id: generateId(),
                    type: 'text',
                    color,
                    strokeWidth,
                    x: point.x,
                    y: point.y,
                    text: text.trim(),
                    fontSize,
                };
                shapesRef.current.push(shape);
                redraw();
                pushHistoryIfNeeded();
            },
            [tool, color, strokeWidth, fontSize, redraw, pushHistoryIfNeeded]
        );

        const handleDoubleClick = useCallback(
            (event: MouseEvent) => {
                if (tool !== 'select') return;
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const point = getCanvasPoint(canvas, event);

                for (let i = shapesRef.current.length - 1; i >= 0; i--) {
                    const shape = shapesRef.current[i];
                    if (shape.type === 'text' && isPointInShape(ctx, point, shape)) {
                        const textShape = shape as TextShape;
                        const newText = window.prompt('Edit text:', textShape.text);
                        if (newText !== null) {
                            textShape.text = newText.trim();
                            redraw();
                            pushHistoryIfNeeded();
                        }
                        return;
                    }
                }
            },
            [tool, redraw, pushHistoryIfNeeded]
        );

        const deleteSelectedShape = useCallback(() => {
            if (!selectedShapeIdRef.current) return;
            shapesRef.current = shapesRef.current.filter(s => s.id !== selectedShapeIdRef.current);
            selectedShapeIdRef.current = null;
            redraw();
            pushHistoryIfNeeded();
        }, [redraw, pushHistoryIfNeeded]);

        // Auto-save current shape when tool changes during drawing
        useEffect(() => {
            if (!isDrawingRef.current || !currentShapeRef.current) {
                redraw();
                return;
            }

            const shape = currentShapeRef.current;

            // Validate and save the in-progress shape
            let valid = true;
            if (shape.type === 'pen' && (shape as PenShape).points.length < 2) valid = false;
            if (
                shape.type === 'rect' &&
                Math.abs((shape as RectShape).width) < 2 &&
                Math.abs((shape as RectShape).height) < 2
            )
                valid = false;
            if (
                shape.type === 'circle' &&
                Math.abs((shape as CircleShape).radiusX) < 2 &&
                Math.abs((shape as CircleShape).radiusY) < 2
            )
                valid = false;
            if (
                shape.type === 'line' &&
                Math.abs((shape as LineShape).x2 - (shape as LineShape).x1) < 2 &&
                Math.abs((shape as LineShape).y2 - (shape as LineShape).y1) < 2
            )
                valid = false;

            if (valid) {
                shapesRef.current.push(shape);
                pushHistoryIfNeededRef.current?.();
            }

            isDrawingRef.current = false;
            currentShapeRef.current = null;
            startPointRef.current = null;
            redraw();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [tool]);

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const onMouseDown = (e: MouseEvent) => {
                if (tool === 'text') {
                    handleTextClick(e);
                } else {
                    handleMouseDown(e);
                }
            };
            const onTouchStart = (e: TouchEvent) => {
                if (tool !== 'text') {
                    handleMouseDown(e);
                }
            };
            const onMouseMoveCursor = (e: MouseEvent) => updateCursor(e);

            const onKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (tool === 'select' && selectedShapeIdRef.current) {
                        e.preventDefault();
                        deleteSelectedShape();
                    }
                }
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'z' && !e.shiftKey) {
                        e.preventDefault();
                        if (historyIndexRef.current > 0) {
                            historyIndexRef.current--;
                            shapesRef.current = [...historyRef.current[historyIndexRef.current]];
                            selectedShapeIdRef.current = null;
                            setCanUndo(historyIndexRef.current > 0);
                            setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
                            redraw();
                            onChange?.();
                        }
                    } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                        e.preventDefault();
                        if (historyIndexRef.current < historyRef.current.length - 1) {
                            historyIndexRef.current++;
                            shapesRef.current = [...historyRef.current[historyIndexRef.current]];
                            selectedShapeIdRef.current = null;
                            setCanUndo(historyIndexRef.current > 0);
                            setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
                            redraw();
                            onChange?.();
                        }
                    }
                }
            };

            canvas.addEventListener('mousedown', onMouseDown);
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseup', handleMouseUp);
            canvas.addEventListener('mouseleave', handleMouseUp);
            canvas.addEventListener('dblclick', handleDoubleClick);
            canvas.addEventListener('touchstart', onTouchStart, { passive: false });
            canvas.addEventListener('touchmove', handleMouseMove, { passive: false });
            canvas.addEventListener('touchend', handleMouseUp);
            canvas.addEventListener('mousemove', onMouseMoveCursor);
            document.addEventListener('keydown', onKeyDown);

            return () => {
                canvas.removeEventListener('mousedown', onMouseDown);
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.removeEventListener('mouseup', handleMouseUp);
                canvas.removeEventListener('mouseleave', handleMouseUp);
                canvas.removeEventListener('dblclick', handleDoubleClick);
                canvas.removeEventListener('touchstart', onTouchStart);
                canvas.removeEventListener('touchmove', handleMouseMove);
                canvas.removeEventListener('touchend', handleMouseUp);
                canvas.removeEventListener('mousemove', onMouseMoveCursor);
                document.removeEventListener('keydown', onKeyDown);
            };
        }, [
            handleMouseDown,
            handleMouseMove,
            handleMouseUp,
            handleTextClick,
            handleDoubleClick,
            updateCursor,
            deleteSelectedShape,
            redraw,
            onChange,
            tool,
        ]);

        useImperativeHandle(ref, () => ({
            getShapesJson: () => JSON.stringify(shapesRef.current),
            getPngBlob: async () => {
                const canvas = canvasRef.current;
                if (!canvas) return null;
                const dataUrl = canvas.toDataURL('image/png');
                const [, base64] = dataUrl.split(',');
                const byteString = atob(base64);
                const arrayBuffer = new ArrayBuffer(byteString.length);
                const uintArray = new Uint8Array(arrayBuffer);
                for (let i = 0; i < byteString.length; i++) {
                    uintArray[i] = byteString.charCodeAt(i);
                }
                return new Blob([uintArray], { type: 'image/png' });
            },
            clear: () => {
                shapesRef.current = [];
                historyRef.current = [];
                historyIndexRef.current = -1;
                selectedShapeIdRef.current = null;
                setCanUndo(false);
                setCanRedo(false);
                redraw();
                onChange?.();
            },
            loadShapes: (json: string) => {
                try {
                    const parsed = JSON.parse(json) as Shape[];
                    shapesRef.current = parsed;
                    historyRef.current = [[...parsed]];
                    historyIndexRef.current = 0;
                    selectedShapeIdRef.current = null;
                    setCanUndo(false);
                    setCanRedo(false);
                    redraw();
                } catch {
                    // ignore invalid json
                }
            },
            undo: () => {
                if (historyIndexRef.current <= 0) return;
                historyIndexRef.current--;
                shapesRef.current = [...historyRef.current[historyIndexRef.current]];
                selectedShapeIdRef.current = null;
                setCanUndo(historyIndexRef.current > 0);
                setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
                redraw();
                onChange?.();
            },
            redo: () => {
                if (historyIndexRef.current >= historyRef.current.length - 1) return;
                historyIndexRef.current++;
                shapesRef.current = [...historyRef.current[historyIndexRef.current]];
                selectedShapeIdRef.current = null;
                setCanUndo(historyIndexRef.current > 0);
                setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
                redraw();
                onChange?.();
            },
            deleteSelected: () => {
                deleteSelectedShape();
            },
            canUndo,
            canRedo,
        }));

        useEffect(() => {
            if (initialShapesJson) {
                try {
                    const parsed = JSON.parse(initialShapesJson) as Shape[];
                    shapesRef.current = parsed;
                    historyRef.current = [[...parsed]];
                    historyIndexRef.current = 0;
                    selectedShapeIdRef.current = null;
                    setCanUndo(false);
                    setCanRedo(false);
                    redraw();
                } catch {
                    // ignore invalid json
                }
            } else {
                shapesRef.current = [];
                historyRef.current = [];
                historyIndexRef.current = -1;
                selectedShapeIdRef.current = null;
                setCanUndo(false);
                setCanRedo(false);
                redraw();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [initialShapesJson]);

        return (
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full cursor-crosshair rounded-md border border-border bg-white"
                style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
            />
        );
    }
);

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
