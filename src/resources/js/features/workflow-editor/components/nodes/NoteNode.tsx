import { memo } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import type { NoteNodeData } from '../../types';
import { NoteIcon } from './icons';

function NoteNode({ data }: NodeProps<Node<NoteNodeData>>) {
    return (
        <div className="rf-note-node">
            <p>
                <span className="rf-note-icon" style={{ color: '#fbbf24' }}>
                    <NoteIcon />
                </span>
                {data.text ?? 'Note'}
            </p>
        </div>
    );
}

export default memo(NoteNode);
