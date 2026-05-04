import { memo } from 'react';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { SubprocessNodeData } from '../../types';
import { SubprocessIcon } from './icons';

function SubprocessNode({ data }: NodeProps<Node<SubprocessNodeData>>) {
    return (
        <div className="rf-flow-node rf-subprocess-node">
            <Handle type="target" position={Position.Left} />
            <div className="rf-node-header">
                <span className="rf-node-header-icon" style={{ color: '#0f5ef7' }}>
                    <SubprocessIcon />
                </span>
                <span className="rf-node-title">{data.linked_workflow_name ?? 'Sub-process'}</span>
            </div>
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default memo(SubprocessNode);
