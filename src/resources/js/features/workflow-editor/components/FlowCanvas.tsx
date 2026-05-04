import type { DragEvent, MouseEvent as ReactMouseEvent, ReactElement } from 'react';
import { memo, useCallback } from 'react';
import { Background, Controls, MiniMap, ReactFlow, useReactFlow } from '@xyflow/react';
import { useTheme } from '@/Components/ThemeProvider';
import type { FlowCanvasProps, WorkflowNodeKind } from '../types';

function FlowCanvas({
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
    onPaneContextMenu,
    onDropNode,
    editable,
}: FlowCanvasProps): ReactElement {
    const { screenToFlowPosition } = useReactFlow();
    const { resolvedTheme } = useTheme();

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

    const handlePaneContextMenu = useCallback(
        (event: MouseEvent | ReactMouseEvent<Element, MouseEvent>) => {
            onPaneContextMenu?.(event as ReactMouseEvent<HTMLDivElement>);
        },
        [onPaneContextMenu]
    );

    return (
        <div className="h-full w-full" data-testid="workflow-canvas">
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
                onPaneContextMenu={editable ? handlePaneContextMenu : undefined}
                onDragOver={editable ? handleDragOver : undefined}
                onDrop={editable ? handleDrop : undefined}
                nodesDraggable={editable}
                nodesConnectable={editable}
                elementsSelectable={editable}
                colorMode={resolvedTheme}
                fitView
            >
                <Background gap={28} size={1.5} color="hsl(var(--muted-foreground) / 0.35)" />
                <MiniMap
                    pannable
                    zoomable
                    position="bottom-left"
                    nodeStrokeColor="hsl(var(--primary))"
                    nodeColor="hsl(var(--muted))"
                />
                <Controls position="bottom-left" style={{ left: 180 }} />
            </ReactFlow>
        </div>
    );
}

export default memo(FlowCanvas);
