import { useCallback, useRef, useState } from 'react';
import type { Node } from '@xyflow/react';
import { generateNodeId } from '../lib/utils';
import type { WorkflowNodeKind } from '../types';

const PASTE_OFFSET = 20;

interface UseEditorClipboardOptions {
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export function useEditorClipboard({ setNodes }: UseEditorClipboardOptions) {
    const [copiedNodes, setCopiedNodes] = useState<Node[]>([]);
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const contextMenuPositionRef = useRef({ x: 0, y: 0 });

    const openContextMenu = useCallback((x: number, y: number) => {
        contextMenuPositionRef.current = { x, y };
        setIsContextMenuOpen(true);
    }, []);

    const closeContextMenu = useCallback(() => {
        setIsContextMenuOpen(false);
    }, []);

    const copyNodes = useCallback((nodesToCopy: Node[]) => {
        setCopiedNodes(nodesToCopy.filter(node => node.type !== 'start'));
    }, []);

    const pasteNodes = useCallback(() => {
        const nodesToPaste = copiedNodes.filter(node => node.type !== 'start');
        if (nodesToPaste.length === 0) return [];

        const newNodes: Node[] = nodesToPaste.map(node => {
            const newId = generateNodeId((node.type ?? 'action') as WorkflowNodeKind);
            return {
                ...node,
                id: newId,
                position: {
                    x: node.position.x + PASTE_OFFSET,
                    y: node.position.y + PASTE_OFFSET,
                },
                selected: false,
            };
        });

        setNodes(currentNodes => [...currentNodes, ...newNodes]);
        setCopiedNodes(newNodes);
        closeContextMenu();

        return newNodes;
    }, [copiedNodes, setNodes, closeContextMenu]);

    const deleteNodes = useCallback(
        (nodeIds: string[]) => {
            setNodes(currentNodes => currentNodes.filter(node => !nodeIds.includes(node.id)));
            closeContextMenu();
        },
        [setNodes, closeContextMenu]
    );

    return {
        copiedNodes,
        copyNodes,
        pasteNodes,
        deleteNodes,
        isContextMenuOpen,
        contextMenuPosition: contextMenuPositionRef.current,
        openContextMenu,
        closeContextMenu,
    };
}
