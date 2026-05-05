import type { ReactElement } from 'react';
import type { WorkflowNodeKind } from '../types';
import {
    ScreenIcon,
    NotificationIcon,
    ConditionIcon,
    ActionIcon,
    TimerIcon,
    SubprocessIcon,
    NoteIcon,
    EndIcon,
} from './nodes/icons';
import { cn } from '@/lib/utils';

interface ContextMenuProps {
    position: { x: number; y: number };
    onAddElement: (kind: WorkflowNodeKind) => void;
    onClose: () => void;
}

interface MenuItem {
    kind: WorkflowNodeKind;
    label: string;
    icon: ReactElement;
    indicatorColor: string;
}

interface MenuGroup {
    label: string;
    items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
    {
        label: 'UI & Feedback',
        items: [
            { kind: 'screen', label: 'Screen', icon: <ScreenIcon />, indicatorColor: '#0f5ef7' },
            {
                kind: 'notification',
                label: 'Notification',
                icon: <NotificationIcon />,
                indicatorColor: '#ef4444',
            },
        ],
    },
    {
        label: 'Logic & Flow',
        items: [
            {
                kind: 'condition',
                label: 'Condition',
                icon: <ConditionIcon />,
                indicatorColor: '#0f5ef7',
            },
            { kind: 'action', label: 'Action', icon: <ActionIcon />, indicatorColor: '#f59e0b' },
            { kind: 'timer', label: 'Timer', icon: <TimerIcon />, indicatorColor: '#64748b' },
            {
                kind: 'subprocess',
                label: 'Sub-process',
                icon: <SubprocessIcon />,
                indicatorColor: '#0f5ef7',
            },
        ],
    },
    {
        label: 'Annotations & End',
        items: [
            { kind: 'note', label: 'Note', icon: <NoteIcon />, indicatorColor: '#fbbf24' },
            { kind: 'end', label: 'End', icon: <EndIcon />, indicatorColor: '#ef4444' },
        ],
    },
];

export default function ContextMenu({
    position,
    onAddElement,
    onClose,
}: ContextMenuProps): ReactElement {
    const handleAddElement = (kind: WorkflowNodeKind) => {
        onAddElement(kind);
        onClose();
    };

    return (
        <div
            className={cn(
                'fixed z-[1000] min-w-[14rem] overflow-hidden rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-elevated-lg'
            )}
            style={{ left: position.x, top: position.y }}
            onClick={e => e.stopPropagation()}
            data-testid="workflow-context-menu"
        >
            {menuGroups.map((group, groupIndex) => (
                <div key={group.label}>
                    {groupIndex > 0 && <div className="my-1 h-px bg-border" />}
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                    </div>
                    {group.items.map(item => (
                        <button
                            key={item.kind}
                            type="button"
                            onClick={() => handleAddElement(item.kind)}
                            data-testid={`add-${item.kind}-node`}
                            className={cn(
                                'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium text-popover-foreground',
                                'transition-colors hover:bg-accent hover:text-accent-foreground',
                                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                            )}
                        >
                            <span
                                style={{ color: item.indicatorColor }}
                                className="flex shrink-0 items-center"
                            >
                                {item.icon}
                            </span>
                            {item.label}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
}
