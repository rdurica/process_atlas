import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { FlashNodeData } from '../../types';

export default function FlashNode({ data }: NodeProps<Node<FlashNodeData>>) {
    const type = data.type ?? 'info';

    return (
        <div className={`rf-flow-node rf-flash-node rf-flash-node-${type}`}>
            <Handle type="target" position={Position.Left} />
            <p className="rf-node-kicker">{type}</p>
            <p className="rf-node-title">{data.text ?? 'Flash'}</p>
            {data.description && <p className="rf-node-body">{data.description}</p>}
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
