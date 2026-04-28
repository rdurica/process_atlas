import { useEffect } from 'react';
import type { Node } from '@xyflow/react';

interface UseWorkflowKeyboardShortcutsOptions {
    enabled: boolean;
    selectedNodes: Node[];
    copiedNodes: Node[];
    copyNodes: (nodes: Node[]) => void;
    pasteNodes: () => void;
    deleteNodes: (nodeIds: string[]) => void;
    undo: () => void;
    redo: () => void;
    clearSelection: () => void;
}

export function useWorkflowKeyboardShortcuts({
    enabled,
    selectedNodes,
    copiedNodes,
    copyNodes,
    pasteNodes,
    deleteNodes,
    undo,
    redo,
    clearSelection,
}: UseWorkflowKeyboardShortcutsOptions) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!enabled) {
                return;
            }

            const isCtrlOrCmd = event.ctrlKey || event.metaKey;

            if (isCtrlOrCmd && event.key === 'c' && selectedNodes.length > 0) {
                event.preventDefault();
                copyNodes(selectedNodes);
            }

            if (isCtrlOrCmd && event.key === 'v' && copiedNodes.length > 0) {
                event.preventDefault();
                pasteNodes();
            }

            if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
            }

            if (isCtrlOrCmd && event.key === 'z' && event.shiftKey) {
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
        selectedNodes,
        copiedNodes,
        copyNodes,
        pasteNodes,
        deleteNodes,
        undo,
        redo,
        clearSelection,
    ]);
}
