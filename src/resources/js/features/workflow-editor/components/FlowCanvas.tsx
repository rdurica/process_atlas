import type { DragEvent, ReactElement } from 'react';
import { useCallback } from 'react';
import { Background, Controls, MiniMap, ReactFlow, useReactFlow } from '@xyflow/react';
import type { FlowCanvasProps, WorkflowNodeKind } from '../types';

export default function FlowCanvas({
    nodes,
    edges,
    nodeTypes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onNodeDoubleClick,
    onEdgeClick,
    onEdgeDoubleClick,
    onPaneClick,
    onDropNode,
    editable,
}: FlowCanvasProps): ReactElement {
    const { screenToFlowPosition } = useReactFlow();

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const kind = e.dataTransfer.getData('application/reactflow') as WorkflowNodeKind;
            if (!kind) return;
            const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
            onDropNode(kind, position);
        },
        [screenToFlowPosition, onDropNode]
    );

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={editable ? onConnect : undefined}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={editable ? onNodeDoubleClick : undefined}
            onEdgeClick={onEdgeClick}
            onEdgeDoubleClick={editable ? onEdgeDoubleClick : undefined}
            onPaneClick={onPaneClick}
            onDragOver={editable ? handleDragOver : undefined}
            onDrop={editable ? handleDrop : undefined}
            nodesDraggable={editable}
            nodesConnectable={editable}
            elementsSelectable={editable}
            fitView
        >
            <Background gap={28} size={1} color="#7aa7f7" />
            <MiniMap
                pannable
                zoomable
                position="bottom-left"
                nodeStrokeColor="#0f5ef7"
                nodeColor="#d6e7ff"
            />
            <Controls position="bottom-left" style={{ left: 180 }} />
        </ReactFlow>
    );
}
