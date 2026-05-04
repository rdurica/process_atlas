import { memo } from 'react';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { StartNodeData } from '../../types';

function StartNode({ data }: NodeProps<Node<StartNodeData>>) {
    return (
        <div className="rf-terminal-node rf-start-node">
            <span className="rf-terminal-node-icon" aria-hidden="true">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    width="12"
                    height="12"
                >
                    <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
            </span>
            <span className="rf-terminal-node-label">{data.label ?? 'Start'}</span>
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default memo(StartNode);
