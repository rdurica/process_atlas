import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { ActionNodeData } from '../../types';
import { ActionIcon } from './icons';

export default function ActionNode({ data }: NodeProps<Node<ActionNodeData>>) {
    return (
        <div className="rf-flow-node rf-action-node">
            <Handle type="target" position={Position.Left} />
            <div className="rf-node-main">
                <span className="rf-node-main-icon" style={{ color: '#0f5ef7' }}>
                    <ActionIcon />
                </span>
                <p className="rf-node-title">{data.title ?? 'Action'}</p>
            </div>
            {data.description && <p className="rf-node-body">{data.description}</p>}
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
