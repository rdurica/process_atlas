import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { NotificationNodeData } from '../../types';
import { NotificationIcon } from './icons';

const severityIconColor: Record<string, string> = {
    error: '#dc2626',
    warning: '#d97706',
    info: '#0284c7',
    success: '#16a34a',
};

export default function NotificationNode({ data }: NodeProps<Node<NotificationNodeData>>) {
    const severity = data.severity ?? 'info';
    const iconColor = severityIconColor[severity] ?? '#0284c7';

    return (
        <div className={`rf-flow-node rf-notification-node rf-notification-node-${severity}`}>
            <Handle type="target" position={Position.Left} />
            <div className="rf-node-main">
                <span className="rf-node-main-icon" style={{ color: iconColor }}>
                    <NotificationIcon />
                </span>
                <p className="rf-node-title">{data.text ?? 'Notification'}</p>
            </div>
            {data.description && <p className="rf-node-body">{data.description}</p>}
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
