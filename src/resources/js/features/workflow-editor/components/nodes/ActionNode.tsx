import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { ActionNodeData } from '../../types';

export default function ActionNode({ data }: NodeProps<Node<ActionNodeData>>) {
    return (
        <div className="rf-flow-node rf-action-node">
            <Handle type="target" position={Position.Left} />
            <p className="rf-node-kicker">action</p>
            <p className="rf-node-title">{data.title ?? 'Action'}</p>
            {data.description && <p className="rf-node-body">{data.description}</p>}
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
