import { memo } from 'react';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { ConditionNodeData } from '../../types';
import { conditionOutputHandles } from '../../lib/utils';
import { ConditionIcon } from './icons';

function ConditionNode({ data }: NodeProps<Node<ConditionNodeData>>) {
    return (
        <div className="rf-flow-node rf-condition-node">
            <Handle type="target" position={Position.Left} />
            <div className="rf-node-main">
                <span className="rf-node-main-icon" style={{ color: '#0f5ef7' }}>
                    <ConditionIcon />
                </span>
                <p className="rf-node-title">{data.condition ?? 'Condition'}</p>
            </div>
            {conditionOutputHandles.map((handleId, index) => (
                <Handle
                    key={handleId}
                    id={handleId}
                    type="source"
                    position={Position.Right}
                    className="rf-condition-output-handle"
                    style={{ top: `${((index + 1) / 6) * 100}%` }}
                />
            ))}
        </div>
    );
}

export default memo(ConditionNode);
