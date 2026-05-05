import { memo } from 'react';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { ActionNodeData } from '../../types';
import { ActionIcon } from './icons';

function ActionNode({ data }: NodeProps<Node<ActionNodeData>>) {
    return (
        <div className="rf-flow-node rf-action-node">
            <Handle type="target" position={Position.Left} />
            <div className="rf-node-main">
                <span className="rf-node-main-icon" style={{ color: '#f59e0b' }}>
                    <ActionIcon />
                </span>
                <p className="rf-node-title">{data.title ?? 'Action'}</p>
            </div>
            {data.note && <p className="rf-node-body">{data.note}</p>}
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default memo(ActionNode);
