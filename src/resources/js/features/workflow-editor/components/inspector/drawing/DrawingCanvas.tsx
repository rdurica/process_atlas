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
    Bounds,
    ResizeHandle,
} from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './types';

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

const HIT_PADDING = 6;
const HANDLE_SIZE = 8;

function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

function getCanvasPoint(canvas: HTMLCanvasElement, event: MouseEvent | TouchEvent): Point {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
    const clientY = 'touches' in event ? (event.touches[0]?.clientY ?? 0) : event.clientY;
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
    };
}

function distanceToLine(point: Point, line: LineShape): number {
    const A = point.x - line.x1;
    const B = point.y - line.y1;
    const C = line.x2 - line.x1;
    const D = line.y2 - line.y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx: number, yy: number;
    if (param < 0) {
        xx = line.x1;
        yy = line.y1;
    } else if (param > 1) {
        xx = line.x2;
        yy = line.y2;
    } else {
        xx = line.x1 + param * C;
        yy = line.y1 + param * D;
    }
    return Math.hypot(point.x - xx, point.y - yy);
}

function isPointInShape(ctx: CanvasRenderingContext2D, point: Point, shape: Shape): boolean {
    switch (shape.type) {
        case 'rect': {
            const minX = Math.min(shape.x, shape.x + shape.width) - HIT_PADDING;
            const maxX = Math.max(shape.x, shape.x + shape.width) + HIT_PADDING;
            const minY = Math.min(shape.y, shape.y + shape.height) - HIT_PADDING;
            const maxY = Math.max(shape.y, shape.y + shape.height) + HIT_PADDING;
            return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
        }
        case 'circle': {
            const dx = point.x - shape.x;
            const dy = point.y - shape.y;
            const rx = Math.abs(shape.radiusX) + HIT_PADDING;
            const ry = Math.abs(shape.radiusY) + HIT_PADDING;
            return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
        }
        case 'line': {
            return distanceToLine(point, shape) <= HIT_PADDING + 2;
        }
        case 'text': {
            ctx.font = `${shape.fontSize}px sans-serif`;
            const metrics = ctx.measureText(shape.text);
            const width = metrics.width + HIT_PADDING * 2;
            const height = shape.fontSize + HIT_PADDING * 2;
            return (
                point.x >= shape.x - HIT_PADDING &&
                point.x <= shape.x + width &&
                point.y >= shape.y - HIT_PADDING &&
                point.y <= shape.y + height
            );
        }
        case 'pen': {
            for (const p of shape.points) {
                if (Math.hypot(point.x - p.x, point.y - p.y) <= HIT_PADDING + 2) {
                    return true;
                }
            }
            return false;
        }
    }
}

function getShapeBounds(ctx: CanvasRenderingContext2D, shape: Shape): Bounds {
    switch (shape.type) {
        case 'rect': {
            return {
                x: Math.min(shape.x, shape.x + shape.width),
                y: Math.min(shape.y, shape.y + shape.height),
                width: Math.abs(shape.width),
                height: Math.abs(shape.height),
            };
        }
        case 'circle': {
            return {
                x: shape.x - Math.abs(shape.radiusX),
                y: shape.y - Math.abs(shape.radiusY),
                width: Math.abs(shape.radiusX) * 2,
                height: Math.abs(shape.radiusY) * 2,
            };
        }
        case 'line': {
            return {
                x: Math.min(shape.x1, shape.x2),
                y: Math.min(shape.y1, shape.y2),
                width: Math.abs(shape.x2 - shape.x1),
                height: Math.abs(shape.y2 - shape.y1),
            };
        }
        case 'text': {
            ctx.font = `${shape.fontSize}px sans-serif`;
            const metrics = ctx.measureText(shape.text);
            return {
                x: shape.x,
                y: shape.y,
                width: metrics.width,
                height: shape.fontSize,
            };
        }
        case 'pen': {
            let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;
            for (const p of shape.points) {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            }
            return {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY,
            };
        }
    }
}

function getResizeHandles(ctx: CanvasRenderingContext2D, shape: Shape): ResizeHandle[] {
    if (shape.type === 'line') {
        return [
            { id: 'start', x: shape.x1, y: shape.y1 },
            { id: 'end', x: shape.x2, y: shape.y2 },
        ];
    }

    const bounds = getShapeBounds(ctx, shape);
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;

    if (shape.type === 'circle') {
        return [
            { id: 'n', x: cx, y: bounds.y },
            { id: 'e', x: bounds.x + bounds.width, y: cy },
            { id: 's', x: cx, y: bounds.y + bounds.height },
            { id: 'w', x: bounds.x, y: cy },
        ];
    }

    if (shape.type === 'text') {
        return [{ id: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height }];
    }

    return [
        { id: 'nw', x: bounds.x, y: bounds.y },
        { id: 'n', x: cx, y: bounds.y },
        { id: 'ne', x: bounds.x + bounds.width, y: bounds.y },
        { id: 'e', x: bounds.x + bounds.width, y: cy },
        { id: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        { id: 's', x: cx, y: bounds.y + bounds.height },
        { id: 'sw', x: bounds.x, y: bounds.y + bounds.height },
        { id: 'w', x: bounds.x, y: cy },
    ];
}

function getHandleAtPoint(
    ctx: CanvasRenderingContext2D,
    point: Point,
    shape: Shape
): ResizeHandle | null {
    const handles = getResizeHandles(ctx, shape);
    for (const handle of handles) {
        if (
            Math.abs(point.x - handle.x) <= HANDLE_SIZE &&
            Math.abs(point.y - handle.y) <= HANDLE_SIZE
        ) {
            return handle;
        }
    }
    return null;
}

function getHandleCursor(handleId: string): string {
    const map: Record<string, string> = {
        nw: 'nw-resize',
        n: 'n-resize',
        ne: 'ne-resize',
        e: 'e-resize',
        se: 'se-resize',
        s: 's-resize',
        sw: 'sw-resize',
        w: 'w-resize',
        start: 'move',
        end: 'move',
    };
    return map[handleId] || 'default';
}

function drawSelectionBox(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    handles: ResizeHandle[]
): void {
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.width + 8, bounds.height + 8);
    ctx.setLineDash([]);

    for (const handle of handles) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1;
        ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8);
        ctx.strokeRect(handle.x - 4, handle.y - 4, 8, 8);
    }
}

function applyResize(shape: Shape, handle: string, dx: number, dy: number): void {
    switch (shape.type) {
        case 'rect': {
            const s = shape as RectShape;
            switch (handle) {
                case 'se':
                    s.width += dx;
                    s.height += dy;
                    break;
                case 'sw':
                    s.x += dx;
                    s.width -= dx;
                    s.height += dy;
                    break;
                case 'ne':
                    s.y += dy;
                    s.width += dx;
                    s.height -= dy;
                    break;
                case 'nw':
                    s.x += dx;
                    s.y += dy;
                    s.width -= dx;
                    s.height -= dy;
                    break;
                case 'e':
                    s.width += dx;
                    break;
                case 'w':
                    s.x += dx;
                    s.width -= dx;
                    break;
                case 's':
                    s.height += dy;
                    break;
                case 'n':
                    s.y += dy;
                    s.height -= dy;
                    break;
            }
            break;
        }
        case 'circle': {
            const s = shape as CircleShape;
            switch (handle) {
                case 'e':
                    s.radiusX += dx / 2;
                    break;
                case 'w':
                    s.x += dx / 2;
                    s.radiusX -= dx / 2;
                    break;
                case 's':
                    s.radiusY += dy / 2;
                    break;
                case 'n':
                    s.y += dy / 2;
                    s.radiusY -= dy / 2;
                    break;
            }
            break;
        }
        case 'line': {
            const s = shape as LineShape;
            if (handle === 'start') {
                s.x1 += dx;
                s.y1 += dy;
            } else if (handle === 'end') {
                s.x2 += dx;
                s.y2 += dy;
            }
            break;
        }
        case 'text': {
            const s = shape as TextShape;
            if (handle === 'se') {
                s.fontSize = Math.max(8, Math.round(s.fontSize + dy / 5));
            }
            break;
        }
    }
}

function applyMove(shape: Shape, dx: number, dy: number): void {
    switch (shape.type) {
        case 'rect': {
            shape.x += dx;
            shape.y += dy;
            break;
        }
        case 'circle': {
            shape.x += dx;
            shape.y += dy;
            break;
        }
        case 'line': {
            shape.x1 += dx;
            shape.y1 += dy;
            shape.x2 += dx;
            shape.y2 += dy;
            break;
        }
        case 'text': {
            shape.x += dx;
            shape.y += dy;
            break;
        }
        case 'pen': {
            for (const p of shape.points) {
                p.x += dx;
                p.y += dy;
            }
            break;
        }
    }
}

function renderShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (shape.type) {
        case 'pen': {
            if (shape.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(shape.points[0].x, shape.points[0].y);
            for (let i = 1; i < shape.points.length; i++) {
                ctx.lineTo(shape.points[i].x, shape.points[i].y);
            }
            ctx.stroke();
            break;
        }
        case 'rect': {
            ctx.beginPath();
            ctx.rect(shape.x, shape.y, shape.width, shape.height);
            ctx.stroke();
            break;
        }
        case 'circle': {
            ctx.beginPath();
            ctx.ellipse(
                shape.x,
                shape.y,
                Math.abs(shape.radiusX),
                Math.abs(shape.radiusY),
                0,
                0,
                2 * Math.PI
            );
            ctx.stroke();
            break;
        }
        case 'line': {
            ctx.beginPath();
            ctx.moveTo(shape.x1, shape.y1);
            ctx.lineTo(shape.x2, shape.y2);
            ctx.stroke();
            break;
        }
        case 'text': {
            ctx.font = `${shape.fontSize}px sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(shape.text, shape.x, shape.y);
            break;
        }
    }
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
