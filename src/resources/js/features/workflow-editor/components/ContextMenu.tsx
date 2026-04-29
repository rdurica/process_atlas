import type { ReactElement } from 'react';
import type { WorkflowNodeKind } from '../types';

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

const IconScreen = (): ReactElement => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        width="16"
        height="16"
    >
        <path d="M4 3a2 2 0 00-2 2v8a2 2 0 002 2h5.5l-.5.5v1.5a.5.5 0 00.5.5h2a.5.5 0 00.5-.5V15.5l-.5-.5H16a2 2 0 002-2V5a2 2 0 00-2-2H4z" />
    </svg>
);

const IconNotification = (): ReactElement => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        width="16"
        height="16"
    >
        <path d="M8 16a2 2 0 004 0H8z" />
        <path
            fillRule="evenodd"
            d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"
            clipRule="evenodd"
        />
    </svg>
);

const IconCondition = (): ReactElement => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        width="16"
        height="16"
    >
        <path d="M10 2l7.5 8-7.5 8-7.5-8L10 2z" />
    </svg>
);

const IconAction = (): ReactElement => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        width="16"
        height="16"
    >
        <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
        />
    </svg>
);

const IconTimer = (): ReactElement => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        width="16"
        height="16"
    >
        <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
            clipRule="evenodd"
        />
    </svg>
);

const IconSubprocess = (): ReactElement => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        width="16"
        height="16"
    >
        <path d="M3 4a2 2 0 012-2h4.5a.5.5 0 01.5.5V5h3V2.5a.5.5 0 01.5-.5H17a2 2 0 012 2v4a2 2 0 01-2 2h-4.5a.5.5 0 01-.5-.5V7h-3v2.5a.5.5 0 01-.5.5H3a2 2 0 01-2-2V4z" />
        <path d="M3 12a2 2 0 012-2h4.5a.5.5 0 01.5.5V13h3v-2.5a.5.5 0 01.5-.5H17a2 2 0 012 2v4a2 2 0 01-2 2h-4.5a.5.5 0 01-.5-.5V15h-3v2.5a.5.5 0 01-.5.5H3a2 2 0 01-2-2v-4z" />
    </svg>
);

const IconNote = (): ReactElement => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        width="16"
        height="16"
    >
        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h7.5l.5-.5V15h2.5l.5-.5V5a2 2 0 00-2-2H4z" />
    </svg>
);

const IconEnd = (): ReactElement => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        width="16"
        height="16"
    >
        <rect x="4" y="4" width="12" height="12" rx="2" />
    </svg>
);

const menuGroups: MenuGroup[] = [
    {
        label: 'UI & Feedback',
        items: [
            { kind: 'screen', label: 'Screen', icon: IconScreen(), indicatorColor: '#0f5ef7' },
            {
                kind: 'notification',
                label: 'Notification',
                icon: IconNotification(),
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
                icon: IconCondition(),
                indicatorColor: '#7c3aed',
            },
            { kind: 'action', label: 'Action', icon: IconAction(), indicatorColor: '#0f5ef7' },
            { kind: 'timer', label: 'Timer', icon: IconTimer(), indicatorColor: '#64748b' },
            {
                kind: 'subprocess',
                label: 'Sub-process',
                icon: IconSubprocess(),
                indicatorColor: '#0f5ef7',
            },
        ],
    },
    {
        label: 'Annotations & End',
        items: [
            { kind: 'note', label: 'Note', icon: IconNote(), indicatorColor: '#fbbf24' },
            { kind: 'end', label: 'End', icon: IconEnd(), indicatorColor: '#64748b' },
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
