import { useEffect } from 'react';
import type { Node } from '@xyflow/react';
import type { GraphState } from '../types';

interface UseWorkflowKeyboardShortcutsOptions {
    enabled: boolean;
    graphState: GraphState;
    selectedNodes: Node[];
    copiedNodes: Node[];
    copyNodes: (nodes: Node[]) => void;
    pasteNodes: () => void;
    deleteNodes: (nodeIds: string[]) => void;
    undo: () => void;
    redo: () => void;
    saveGraph: () => Promise<void>;
    clearSelection: () => void;
}

export function useWorkflowKeyboardShortcuts({
    enabled,
    graphState,
    selectedNodes,
    copiedNodes,
    copyNodes,
    pasteNodes,
    deleteNodes,
    undo,
    redo,
    saveGraph,
    clearSelection,
}: UseWorkflowKeyboardShortcutsOptions) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const isCtrlOrCmd = event.ctrlKey || event.metaKey;
            const key = event.key.toLowerCase();

            if (isCtrlOrCmd && key === 's') {
                event.preventDefault();

                if (enabled && graphState !== 'saving') {
                    void saveGraph();
                }

                return;
            }

            if (!enabled) {
                return;
            }

            if (isCtrlOrCmd && key === 'c' && selectedNodes.length > 0) {
                event.preventDefault();
                copyNodes(selectedNodes);
            }

            if (isCtrlOrCmd && key === 'v' && copiedNodes.length > 0) {
                event.preventDefault();
                pasteNodes();
            }

            if (isCtrlOrCmd && key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
            }

            if (isCtrlOrCmd && key === 'z' && event.shiftKey) {
                event.preventDefault();
                redo();
            }

            if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodes.length > 0) {
                event.preventDefault();
                const idsToDelete = selectedNodes
                    .filter(node => node.type !== 'start')
                    .map(node => node.id);

                if (idsToDelete.length > 0) {
                    deleteNodes(idsToDelete);
                }

                clearSelection();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        enabled,
        graphState,
        selectedNodes,
        copiedNodes,
        copyNodes,
        pasteNodes,
        deleteNodes,
        undo,
        redo,
        saveGraph,
        clearSelection,
    ]);
}
