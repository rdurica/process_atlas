import { useCallback, useState } from 'react';
import type { Node } from '@xyflow/react';

const PASTE_OFFSET = 20;

interface UseCopyPasteOptions {
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export function useCopyPaste({ setNodes }: UseCopyPasteOptions) {
    const [copiedNodes, setCopiedNodes] = useState<Node[]>([]);
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

    const openContextMenu = useCallback((x: number, y: number) => {
        setContextMenuPosition({ x, y });
        setIsContextMenuOpen(true);
    }, []);

    const closeContextMenu = useCallback(() => {
        setIsContextMenuOpen(false);
    }, []);

    const copyNodes = useCallback((nodesToCopy: Node[]) => {
        setCopiedNodes(nodesToCopy);
    }, []);

    const pasteNodes = useCallback(() => {
        if (copiedNodes.length === 0) return [];

        const newNodes: Node[] = copiedNodes.map((node, index) => {
            const newId = `${node.type}-${Date.now()}-${index}`;
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

    const deleteNodes = useCallback((nodeIds: string[]) => {
        setNodes(currentNodes => currentNodes.filter(node => !nodeIds.includes(node.id)));
        closeContextMenu();
    }, [setNodes, closeContextMenu]);

    return {
        copiedNodes,
        copyNodes,
        pasteNodes,
        deleteNodes,
        isContextMenuOpen,
        contextMenuPosition,
        openContextMenu,
        closeContextMenu,
    };
}