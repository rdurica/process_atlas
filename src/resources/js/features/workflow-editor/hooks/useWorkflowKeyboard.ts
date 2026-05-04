import { useEffect } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import type { Node, Edge } from '@xyflow/react';

interface UseWorkflowKeyboardOptions {
    nodes: Node[];
    edges: Edge[];
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    canEditWorkflows: boolean;
    saveGraph: () => Promise<void>;
    copyNodes: (nodes: Node[]) => void;
    pasteNodes: () => Node[];
}

export function useWorkflowKeyboard({
    nodes,
    edges,
    setNodes,
    setEdges,
    canEditWorkflows,
    saveGraph,
    copyNodes,
    pasteNodes,
}: UseWorkflowKeyboardOptions) {
    const { undo, redo, canUndo, canRedo } = useCanvasHistory(nodes, edges, setNodes, setEdges);

    const selectedNodeId = useEditorStore(state => state.selectedNodeId);
    const clearSelection = useEditorStore(state => state.clearSelection);
    const graphState = useEditorStore(state => state.graphState);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const isCtrlOrCmd = event.ctrlKey || event.metaKey;
            const key = event.key.toLowerCase();

            if (isCtrlOrCmd && key === 's') {
                event.preventDefault();
                if (canEditWorkflows && graphState !== 'saving') {
                    void saveGraph();
                }
                return;
            }

            if (!canEditWorkflows) {
                return;
            }

            if (isCtrlOrCmd && key === 'c') {
                event.preventDefault();
                const selected = nodes.filter(node => node.selected);
                if (selected.length > 0) {
                    copyNodes(selected);
                }
                return;
            }

            if (isCtrlOrCmd && key === 'v') {
                event.preventDefault();
                pasteNodes();
                return;
            }

            if (isCtrlOrCmd && key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
            }

            if (isCtrlOrCmd && key === 'z' && event.shiftKey) {
                event.preventDefault();
                redo();
            }

            if (event.key === 'Delete' || event.key === 'Backspace') {
                event.preventDefault();
                if (selectedNodeId) {
                    const node = nodes.find(n => n.id === selectedNodeId);
                    if (node && node.type !== 'start') {
                        setNodes(current => current.filter(n => n.id !== selectedNodeId));
                        setEdges(current =>
                            current.filter(
                                e => e.source !== selectedNodeId && e.target !== selectedNodeId
                            )
                        );
                        clearSelection();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        canEditWorkflows,
        graphState,
        selectedNodeId,
        nodes,
        edges,
        setNodes,
        setEdges,
        undo,
        redo,
        clearSelection,
        saveGraph,
        copyNodes,
        pasteNodes,
    ]);

    return { undo, redo, canUndo, canRedo };
}
