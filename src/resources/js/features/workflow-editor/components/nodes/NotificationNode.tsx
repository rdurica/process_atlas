import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { NotificationNodeData } from '../../types';

export default function NotificationNode({ data }: NodeProps<Node<NotificationNodeData>>) {
    const severity = data.severity ?? 'info';

    return (
        <div className={`rf-flow-node rf-notification-node rf-notification-node-${severity}`}>
            <Handle type="target" position={Position.Left} />
            <p className="rf-node-kicker">{severity}</p>
            <p className="rf-node-title">{data.text ?? 'Notification'}</p>
            {data.description && <p className="rf-node-body">{data.description}</p>}
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
