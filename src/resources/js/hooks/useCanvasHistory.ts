import { useCallback, useEffect, useRef, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';

type CanvasSnapshot = {
    nodes: Node[];
    edges: Edge[];
};

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

function nodesAreSignificantlyEqual(a: Node[], b: Node[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    const mapB = new Map(b.map(n => [n.id, n]));

    for (const nodeA of a) {
        const nodeB = mapB.get(nodeA.id);
        if (!nodeB) {
            return false;
        }

        if (nodeA.position.x !== nodeB.position.x || nodeA.position.y !== nodeB.position.y) {
            return false;
        }

        if (nodeA.width !== nodeB.width || nodeA.height !== nodeB.height) {
            return false;
        }

        if (JSON.stringify(nodeA.data) !== JSON.stringify(nodeB.data)) {
            return false;
        }
    }

    return true;
}

function edgesAreSignificantlyEqual(a: Edge[], b: Edge[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    const mapB = new Map(b.map(e => [e.id, e]));

    for (const edgeA of a) {
        const edgeB = mapB.get(edgeA.id);
        if (!edgeB) {
            return false;
        }

        if (edgeA.source !== edgeB.source || edgeA.target !== edgeB.target) {
            return false;
        }

        if (
            edgeA.sourceHandle !== edgeB.sourceHandle ||
            edgeA.targetHandle !== edgeB.targetHandle
        ) {
            return false;
        }

        if (edgeA.label !== edgeB.label) {
            return false;
        }
    }

    return true;
}

export function useCanvasHistory(
    nodes: Node[],
    edges: Edge[],
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
) {
    const historyRef = useRef<CanvasSnapshot[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const isInitializedRef = useRef(false);
    const isUndoingRef = useRef(false);
    const lastNodesRef = useRef<Node[]>([]);
    const lastEdgesRef = useRef<Edge[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialize history with the first snapshot
    useEffect(() => {
        if (isInitializedRef.current) {
            return;
        }

        isInitializedRef.current = true;

        const snapshot: CanvasSnapshot = {
            nodes: clone(nodes),
            edges: clone(edges),
        };

        historyRef.current = [snapshot];
        setHistoryIndex(0);
        lastNodesRef.current = clone(nodes);
        lastEdgesRef.current = clone(edges);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Watch for significant changes and push snapshots
    useEffect(() => {
        if (!isInitializedRef.current) {
            return;
        }

        if (isUndoingRef.current) {
            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            const nodesEqual = nodesAreSignificantlyEqual(lastNodesRef.current, nodes);
            const edgesEqual = edgesAreSignificantlyEqual(lastEdgesRef.current, edges);

            if (nodesEqual && edgesEqual) {
                return;
            }

            // If user is in the middle of history, discard future entries
            const trimmed = historyRef.current.slice(0, historyIndex + 1);

            const snapshot: CanvasSnapshot = {
                nodes: clone(nodes),
                edges: clone(edges),
            };

            trimmed.push(snapshot);

            if (trimmed.length > 15) {
                trimmed.shift();
                historyRef.current = trimmed;
                // index stays the same because we shifted from the front
            } else {
                historyRef.current = trimmed;
                setHistoryIndex(prev => prev + 1);
            }

            lastNodesRef.current = clone(nodes);
            lastEdgesRef.current = clone(edges);
        }, 150);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [nodes, edges, historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex <= 0) {
            return;
        }

        const nextIndex = historyIndex - 1;
        const snapshot = historyRef.current[nextIndex];

        isUndoingRef.current = true;
        setNodes(clone(snapshot.nodes));
        setEdges(clone(snapshot.edges));
        lastNodesRef.current = clone(snapshot.nodes);
        lastEdgesRef.current = clone(snapshot.edges);
        setHistoryIndex(nextIndex);

        setTimeout(() => {
            isUndoingRef.current = false;
        }, 50);
    }, [historyIndex, setNodes, setEdges]);

    const redo = useCallback(() => {
        if (historyIndex >= historyRef.current.length - 1) {
            return;
        }

        const nextIndex = historyIndex + 1;
        const snapshot = historyRef.current[nextIndex];

        isUndoingRef.current = true;
        setNodes(clone(snapshot.nodes));
        setEdges(clone(snapshot.edges));
        lastNodesRef.current = clone(snapshot.nodes);
        lastEdgesRef.current = clone(snapshot.edges);
        setHistoryIndex(nextIndex);

        setTimeout(() => {
            isUndoingRef.current = false;
        }, 50);
    }, [historyIndex, setNodes, setEdges]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < historyRef.current.length - 1;

    return { undo, redo, canUndo, canRedo };
}
