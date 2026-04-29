import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { TimerNodeData } from '../../types';

export default function TimerNode({ data }: NodeProps<Node<TimerNodeData>>) {
    return (
        <div className="rf-flow-node rf-timer-node">
            <Handle type="target" position={Position.Left} />
            <span className="rf-timer-icon" aria-hidden="true">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    width="14"
                    height="14"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                        clipRule="evenodd"
                    />
                </svg>
            </span>
            <span className="rf-node-title">{data.text ?? 'Timer'}</span>
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
