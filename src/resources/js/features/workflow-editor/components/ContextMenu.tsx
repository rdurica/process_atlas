import type { ReactElement } from 'react';
import type { WorkflowNodeKind } from '../types';

interface ContextMenuProps {
    position: { x: number; y: number };
    onAddElement: (kind: WorkflowNodeKind) => void;
    onClose: () => void;
}

const addElementKinds: [WorkflowNodeKind, string][] = [
    ['screen', 'Screen'],
    ['flash', 'Flash'],
    ['condition', 'Condition'],
    ['action', 'Action'],
    ['end', 'End'],
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
        >
            <div className="context-menu-section">
                <div className="context-menu-header">Add Element</div>
                {addElementKinds.map(([kind, label]) => (
                    <div
                        key={kind}
                        className="context-menu-item"
                        onClick={() => handleAddElement(kind)}
                    >
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}
