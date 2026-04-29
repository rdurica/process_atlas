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
                indicatorColor: '#7c3aed',
            },
            { kind: 'action', label: 'Action', icon: <ActionIcon />, indicatorColor: '#0f5ef7' },
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
            { kind: 'end', label: 'End', icon: <EndIcon />, indicatorColor: '#64748b' },
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
            className="context-menu"
            style={{ left: position.x, top: position.y }}
            onClick={e => e.stopPropagation()}
            data-testid="workflow-context-menu"
        >
            {menuGroups.map((group, groupIndex) => (
                <div key={group.label}>
                    {groupIndex > 0 && <div className="context-menu-divider" />}
                    <div className="context-menu-section">
                        <div className="context-menu-header">{group.label}</div>
                        {group.items.map(item => (
                            <div
                                key={item.kind}
                                className="context-menu-item"
                                onClick={() => handleAddElement(item.kind)}
                                data-testid={`add-${item.kind}-node`}
                            >
                                <span
                                    className="context-menu-icon"
                                    style={{ color: item.indicatorColor }}
                                >
                                    {item.icon}
                                </span>
                                <span className="context-menu-label">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
