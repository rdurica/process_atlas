import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { SubprocessNodeData } from '../../types';

export default function SubprocessNode({ data }: NodeProps<Node<SubprocessNodeData>>) {
    return (
        <div className="rf-flow-node rf-subprocess-node">
            <Handle type="target" position={Position.Left} />
            <span className="rf-node-title">{data.linked_workflow_name ?? 'Sub-process'}</span>
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
