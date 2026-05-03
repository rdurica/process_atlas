import { cn } from '@/lib/utils';
import {
    MousePointer,
    Pencil,
    Square,
    Circle,
    Minus,
    Type,
    Undo2,
    Redo2,
    Trash2,
    Eraser,
} from 'lucide-react';
import type { DrawingTool } from './types';

interface DrawingToolbarProps {
    tool: DrawingTool;
    onToolChange: (tool: DrawingTool) => void;
    color: string;
    onColorChange: (color: string) => void;
    strokeWidth: number;
    onStrokeWidthChange: (width: number) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onClear: () => void;
    canDelete: boolean;
    onDelete: () => void;
}

const TOOLS: { value: DrawingTool; icon: React.ReactNode; label: string }[] = [
    { value: 'select', icon: <MousePointer className="h-5 w-5" />, label: 'Select' },
    { value: 'pen', icon: <Pencil className="h-5 w-5" />, label: 'Pen' },
    { value: 'rect', icon: <Square className="h-5 w-5" />, label: 'Rectangle' },
    { value: 'circle', icon: <Circle className="h-5 w-5" />, label: 'Circle' },
    { value: 'line', icon: <Minus className="h-5 w-5" />, label: 'Line' },
    { value: 'text', icon: <Type className="h-5 w-5" />, label: 'Text' },
];

const COLORS = [
    '#1e293b',
    '#dc2626',
    '#ea580c',
    '#ca8a04',
    '#16a34a',
    '#2563eb',
    '#9333ea',
    '#db2777',
];

export default function DrawingToolbar({
    tool,
    onToolChange,
    color,
    onColorChange,
    strokeWidth,
    onStrokeWidthChange,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onClear,
    canDelete,
    onDelete,
}: DrawingToolbarProps) {
    return (
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-3">
            {/* Tools */}
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tools
                </span>
                {TOOLS.map(t => (
                    <button
                        key={t.value}
                        type="button"
                        onClick={() => onToolChange(t.value)}
                        className={cn(
                            'flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                            tool === t.value
                                ? 'bg-primary text-primary-foreground ring-1 ring-primary'
                                : 'text-muted-foreground hover:bg-accent'
                        )}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Colors */}
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Color
                </span>
                <div className="flex flex-wrap gap-1.5">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => onColorChange(c)}
                            className={cn(
                                'h-6 w-6 rounded-full border-2 transition-all',
                                color === c ? 'scale-110 border-foreground' : 'border-transparent'
                            )}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>

            {/* Stroke width */}
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Width
                </span>
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min={1}
                        max={10}
                        value={strokeWidth}
                        onChange={e => onStrokeWidthChange(Number(e.target.value))}
                        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                    />
                    <span className="min-w-[1.5rem] text-right text-xs text-muted-foreground">
                        {strokeWidth}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1 border-t pt-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                </span>
                <div className="flex gap-1">
                    <button
                        type="button"
                        title="Undo (Ctrl+Z)"
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
                    >
                        <Undo2 className="h-4 w-4" />
                        Undo
                    </button>
                    <button
                        type="button"
                        title="Redo (Ctrl+Shift+Z)"
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
                    >
                        <Redo2 className="h-4 w-4" />
                        Redo
                    </button>
                </div>

                {canDelete && (
                    <button
                        type="button"
                        title="Delete selected"
                        onClick={onDelete}
                        className="flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                        <Eraser className="h-4 w-4" />
                        Delete
                    </button>
                )}

                <button
                    type="button"
                    title="Clear all"
                    onClick={onClear}
                    className="flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                    <Trash2 className="h-4 w-4" />
                    Clear all
                </button>
            </div>
        </div>
    );
}
