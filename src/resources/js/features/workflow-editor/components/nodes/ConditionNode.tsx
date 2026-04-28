import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { ConditionNodeData } from '../../types';

const conditionOutputHandles = ['out-1', 'out-2', 'out-3', 'out-4', 'out-5'];

export default function ConditionNode({ data }: NodeProps<Node<ConditionNodeData>>) {
    return (
        <div className="rf-flow-node rf-condition-node">
            <Handle type="target" position={Position.Left} />
            <p className="rf-node-kicker">condition</p>
            <p className="rf-node-title">{data.condition ?? 'Condition'}</p>
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
