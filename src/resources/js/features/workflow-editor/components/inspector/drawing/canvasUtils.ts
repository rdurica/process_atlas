import type {
    Bounds,
    CircleShape,
    LineShape,
    Point,
    RectShape,
    ResizeHandle,
    Shape,
    TextShape,
} from './types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './types';

const HIT_PADDING = 6;
const HANDLE_SIZE = 8;

export function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

export function getCanvasPoint(canvas: HTMLCanvasElement, event: MouseEvent | TouchEvent): Point {
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

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx: number;
    let yy: number;

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

export function isPointInShape(ctx: CanvasRenderingContext2D, point: Point, shape: Shape): boolean {
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
        case 'line':
            return distanceToLine(point, shape) <= HIT_PADDING + 2;
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
        case 'pen':
            return shape.points.some(
                pointInShape =>
                    Math.hypot(point.x - pointInShape.x, point.y - pointInShape.y) <=
                    HIT_PADDING + 2
            );
    }
}

export function getShapeBounds(ctx: CanvasRenderingContext2D, shape: Shape): Bounds {
    switch (shape.type) {
        case 'rect':
            return {
                x: Math.min(shape.x, shape.x + shape.width),
                y: Math.min(shape.y, shape.y + shape.height),
                width: Math.abs(shape.width),
                height: Math.abs(shape.height),
            };
        case 'circle':
            return {
                x: shape.x - Math.abs(shape.radiusX),
                y: shape.y - Math.abs(shape.radiusY),
                width: Math.abs(shape.radiusX) * 2,
                height: Math.abs(shape.radiusY) * 2,
            };
        case 'line':
            return {
                x: Math.min(shape.x1, shape.x2),
                y: Math.min(shape.y1, shape.y2),
                width: Math.abs(shape.x2 - shape.x1),
                height: Math.abs(shape.y2 - shape.y1),
            };
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
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            for (const point of shape.points) {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
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

export function getResizeHandles(ctx: CanvasRenderingContext2D, shape: Shape): ResizeHandle[] {
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

export function getHandleAtPoint(
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

export function getHandleCursor(handleId: string): string {
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

export function drawSelectionBox(
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

export function applyResize(shape: Shape, handle: string, dx: number, dy: number): void {
    switch (shape.type) {
        case 'rect': {
            const rect = shape as RectShape;

            switch (handle) {
                case 'se':
                    rect.width += dx;
                    rect.height += dy;
                    break;
                case 'sw':
                    rect.x += dx;
                    rect.width -= dx;
                    rect.height += dy;
                    break;
                case 'ne':
                    rect.y += dy;
                    rect.width += dx;
                    rect.height -= dy;
                    break;
                case 'nw':
                    rect.x += dx;
                    rect.y += dy;
                    rect.width -= dx;
                    rect.height -= dy;
                    break;
                case 'e':
                    rect.width += dx;
                    break;
                case 'w':
                    rect.x += dx;
                    rect.width -= dx;
                    break;
                case 's':
                    rect.height += dy;
                    break;
                case 'n':
                    rect.y += dy;
                    rect.height -= dy;
                    break;
            }

            break;
        }
        case 'circle': {
            const circle = shape as CircleShape;

            switch (handle) {
                case 'e':
                    circle.radiusX += dx / 2;
                    break;
                case 'w':
                    circle.x += dx / 2;
                    circle.radiusX -= dx / 2;
                    break;
                case 's':
                    circle.radiusY += dy / 2;
                    break;
                case 'n':
                    circle.y += dy / 2;
                    circle.radiusY -= dy / 2;
                    break;
            }

            break;
        }
        case 'line':
            if (handle === 'start') {
                shape.x1 += dx;
                shape.y1 += dy;
            } else if (handle === 'end') {
                shape.x2 += dx;
                shape.y2 += dy;
            }
            break;
        case 'text':
            if (handle === 'se') {
                shape.fontSize = Math.max(8, Math.round((shape as TextShape).fontSize + dy / 5));
            }
            break;
    }
}

export function applyMove(shape: Shape, dx: number, dy: number): void {
    switch (shape.type) {
        case 'rect':
        case 'circle':
        case 'text':
            shape.x += dx;
            shape.y += dy;
            break;
        case 'line':
            shape.x1 += dx;
            shape.y1 += dy;
            shape.x2 += dx;
            shape.y2 += dy;
            break;
        case 'pen':
            for (const point of shape.points) {
                point.x += dx;
                point.y += dy;
            }
            break;
    }
}

export function renderShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (shape.type) {
        case 'pen':
            if (shape.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(shape.points[0].x, shape.points[0].y);
            for (let i = 1; i < shape.points.length; i++) {
                ctx.lineTo(shape.points[i].x, shape.points[i].y);
            }
            ctx.stroke();
            break;
        case 'rect':
            ctx.beginPath();
            ctx.rect(shape.x, shape.y, shape.width, shape.height);
            ctx.stroke();
            break;
        case 'circle':
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
        case 'line':
            ctx.beginPath();
            ctx.moveTo(shape.x1, shape.y1);
            ctx.lineTo(shape.x2, shape.y2);
            ctx.stroke();
            break;
        case 'text':
            ctx.font = `${shape.fontSize}px sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(shape.text, shape.x, shape.y);
            break;
    }
}
