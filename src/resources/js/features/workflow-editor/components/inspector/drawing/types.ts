export type DrawingTool = 'select' | 'pen' | 'rect' | 'circle' | 'line' | 'text';

export interface Point {
    x: number;
    y: number;
}

export interface BaseShape {
    id: string;
    type: DrawingTool;
    color: string;
    strokeWidth: number;
}

export interface PenShape extends BaseShape {
    type: 'pen';
    points: Point[];
}

export interface RectShape extends BaseShape {
    type: 'rect';
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CircleShape extends BaseShape {
    type: 'circle';
    x: number;
    y: number;
    radiusX: number;
    radiusY: number;
}

export interface LineShape extends BaseShape {
    type: 'line';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface TextShape extends BaseShape {
    type: 'text';
    x: number;
    y: number;
    text: string;
    fontSize: number;
}

export type Shape = PenShape | RectShape | CircleShape | LineShape | TextShape;

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ResizeHandle {
    id: string;
    x: number;
    y: number;
}

export type InteractionMode = 'none' | 'move' | 'resize';

export interface DrawingState {
    shapes: Shape[];
    tool: DrawingTool;
    color: string;
    strokeWidth: number;
    fontSize: number;
    isDrawing: boolean;
    currentShape: Shape | null;
    startPoint: Point | null;
}

export const DEFAULT_DRAWING_COLOR = '#1e293b';
export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_FONT_SIZE = 14;
export const CANVAS_WIDTH = 360;
export const CANVAS_HEIGHT = 720;
