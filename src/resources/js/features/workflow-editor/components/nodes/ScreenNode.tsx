import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import type { ScreenNodeData } from '../../types';
import { ScreenIcon } from './icons';

export default function ScreenNode({ data }: NodeProps<Node<ScreenNodeData>>) {
    if (data.image_url) {
        return (
            <div className="rf-screen-node rf-screen-node-image">
                <Handle type="target" position={Position.Left} />
                <div className="rf-screen-image-frame">
                    <img
                        src={data.image_url}
                        alt={data.label ?? 'Screen'}
                        className="rf-screen-image"
                    />
                    <div className="rf-screen-image-footer">
                        <span className="rf-screen-image-label">{data.label ?? 'Screen'}</span>
                        {data.subtitle && (
                            <span className="rf-screen-image-subtitle">{data.subtitle}</span>
                        )}
                    </div>
                </div>
                <Handle type="source" position={Position.Right} />
            </div>
        );
    }

    return (
        <div className="rf-screen-node">
            <Handle type="target" position={Position.Left} />
            <div className="rf-node-box">
                <span className="rf-node-box-icon" style={{ color: '#0f5ef7' }}>
                    <ScreenIcon />
                </span>
                {data.label ?? 'Screen'}
            </div>
            {data.subtitle && <div className="rf-node-subtitle">{data.subtitle}</div>}
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
