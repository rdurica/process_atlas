import type { Node, NodeProps } from '@xyflow/react';
import type { NoteNodeData } from '../../types';

export default function NoteNode({ data }: NodeProps<Node<NoteNodeData>>) {
    return (
        <div className="rf-note-node">
            <p>{data.text ?? 'Note'}</p>
        </div>
    );
}
