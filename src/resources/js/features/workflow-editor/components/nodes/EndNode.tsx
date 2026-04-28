import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { EndNodeData } from '../../types';

export default function EndNode({ data }: NodeProps<Node<EndNodeData>>) {
    return (
        <div className="rf-terminal-node rf-end-node">
            <Handle type="target" position={Position.Left} />
            <div className="rf-terminal-node-row">
                <span className="rf-terminal-node-icon" aria-hidden="true">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        width="12"
                        height="12"
                    >
                        <rect x="4" y="4" width="12" height="12" rx="2" />
                    </svg>
                </span>
                <span className="rf-terminal-node-label">{data.label ?? 'End'}</span>
            </div>
            {data.linked_workflow_name && (
                <span className="rf-end-node-chain">{data.linked_workflow_name}</span>
            )}
        </div>
    );
}
