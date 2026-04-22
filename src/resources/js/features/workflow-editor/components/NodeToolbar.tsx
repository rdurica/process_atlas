import type { DragEvent, ReactElement } from 'react';
import type { WorkflowNodeKind } from '../types';

interface NodeToolbarProps {
    onAddNode: (kind: Exclude<WorkflowNodeKind, 'screen' | 'if'>) => void;
    onAddScreenNode: () => void;
    editable: boolean;
}

const nodeKinds: [WorkflowNodeKind, string][] = [
    ['screen', 'Screen'],
    ['flash', 'Flash'],
    ['condition', 'Condition'],
    ['action', 'Action'],
];

const terminalKinds: [WorkflowNodeKind, string][] = [
    ['start', 'Start'],
    ['end', 'End'],
];

export default function NodeToolbar({
    onAddNode,
    onAddScreenNode,
    editable,
}: NodeToolbarProps): ReactElement {
    const handleDragStart = (e: DragEvent<HTMLDivElement>, kind: WorkflowNodeKind) => {
        e.dataTransfer.setData('application/reactflow', kind);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleNodeClick = (kind: WorkflowNodeKind) => {
        if (kind === 'screen') {
            onAddScreenNode();
        } else {
            onAddNode(kind as Exclude<WorkflowNodeKind, 'screen' | 'if'>);
        }
    };

    return (
        <aside className="workflow-node-toolbar" aria-label="Add workflow node">
            <p className="eyebrow">Add</p>
            {nodeKinds.map(([kind, label]) => (
                <div
                    key={kind}
                    draggable={editable}
                    onDragStart={(e: DragEvent<HTMLDivElement>) => handleDragStart(e, kind)}
                    onClick={() => handleNodeClick(kind)}
                    aria-disabled={!editable}
                    className="workflow-node-toolbar-button"
                >
                    {label}
                </div>
            ))}
            <hr className="workflow-node-toolbar-divider" />
            <p className="eyebrow">Terminals</p>
            {terminalKinds.map(([kind, label]) => (
                <div
                    key={kind}
                    draggable={editable}
                    onDragStart={(e: DragEvent<HTMLDivElement>) => handleDragStart(e, kind)}
                    onClick={() => handleNodeClick(kind)}
                    aria-disabled={!editable}
                    className="workflow-node-toolbar-button"
                >
                    {label}
                </div>
            ))}
        </aside>
    );
}
