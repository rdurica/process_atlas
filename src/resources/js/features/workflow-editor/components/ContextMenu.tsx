import type { ReactElement } from 'react';
import type { WorkflowNodeKind } from '../types';

interface ContextMenuProps {
    position: { x: number; y: number };
    onAddElement: (kind: WorkflowNodeKind) => void;
    onCopy: () => void;
    onPaste: () => void;
    onDelete: () => void;
    hasSelection: boolean;
    onClose: () => void;
}

const addElementKinds: [WorkflowNodeKind, string][] = [
    ['screen', 'Screen'],
    ['flash', 'Flash'],
    ['condition', 'Condition'],
    ['action', 'Action'],
    ['start', 'Start'],
    ['end', 'End'],
];

export default function ContextMenu({
    position,
    onAddElement,
    onCopy,
    onPaste,
    onDelete,
    hasSelection,
    onClose,
}: ContextMenuProps): ReactElement {
    const handleAddElement = (kind: WorkflowNodeKind) => {
        onAddElement(kind);
        onClose();
    };

    const handleCopy = () => {
        onCopy();
        onClose();
    };

    const handlePaste = () => {
        onPaste();
    };

    const handleDelete = () => {
        onDelete();
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

            {hasSelection && (
                <>
                    <div className="context-menu-divider" />
                    <div className="context-menu-section">
                        <div
                            className="context-menu-item"
                            onClick={handleCopy}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && handleCopy()}
                        >
                            <span>Copy</span>
                            <span className="context-menu-shortcut">Ctrl+C</span>
                        </div>
                        <div
                            className="context-menu-item"
                            onClick={handlePaste}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && handlePaste()}
                        >
                            <span>Paste</span>
                            <span className="context-menu-shortcut">Ctrl+V</span>
                        </div>
                        <div
                            className="context-menu-item context-menu-item-danger"
                            onClick={handleDelete}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && handleDelete()}
                        >
                            <span>Delete</span>
                            <span className="context-menu-shortcut">Del</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}