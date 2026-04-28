import { useCallback, useEffect, useRef, useState } from 'react';
import {
    addEdge,
    Connection,
    Edge,
    MarkerType,
    Node,
    OnEdgesChange,
    OnConnect,
    OnNodesChange,
    useEdgesState,
    useNodesState,
} from '@xyflow/react';
import type { WorkflowNodeData, WorkflowNodeKind, GraphState } from '../types';
import { buildInitialNodes, conditionOutputLabel, isConditionNodeKind } from '../lib/utils';
import { processAtlasApi } from '@/shared/api/processAtlasApi';

interface UseWorkflowGraphOptions {
    initialNodes: Node[];
    initialEdges: Edge[];
    lockVersion: number;
    latestRevisionId: number | null;
    canEdit: boolean;
}

interface UseWorkflowGraphReturn {
    nodes: Node[];
    edges: Edge[];
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    onNodesChange: OnNodesChange<Node>;
    onEdgesChange: OnEdgesChange<Edge>;
    onConnect: OnConnect;
    addNode: (
        nodeKind: Exclude<WorkflowNodeKind, 'screen' | 'if'>,
        position?: { x: number; y: number }
    ) => string;
    addScreenNode: (position?: { x: number; y: number }) => string;
    removeNode: (nodeId: string) => void;
    updateNodeData: (nodeId: string, patch: Partial<WorkflowNodeData>) => void;
    updateEdgeLabel: (edgeId: string, label: string | undefined) => void;
    removeEdge: (edgeId: string) => void;
    saveGraph: (source?: 'ui' | 'autosave') => Promise<void>;
    graphState: GraphState;
    graphMessage: string;
    lockVersion: number;
    setGraphState: (state: GraphState) => void;
    setGraphMessage: (message: string) => void;
    markGraphSaved: (message: string) => void;
    initializeGraph: (options: {
        nodes?: Node[];
        edges?: Edge[];
        screens?: import('@/types/processAtlas').Screen[];
        lockVersion?: number;
    }) => void;
}

export function useWorkflowGraph({
    initialNodes,
    initialEdges,
    lockVersion: initialLockVersion,
    latestRevisionId,
    canEdit,
}: UseWorkflowGraphOptions): UseWorkflowGraphReturn {
    const initialEdgesWithMarkers = initialEdges.map(edge => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#0f5ef7', width: 10, height: 10 },
    }));

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdgesWithMarkers);
    const [graphState, setGraphState] = useState<GraphState>('saved');
    const [graphMessage, setGraphMessage] = useState<string>('No pending canvas changes.');
    const [lockVersion, setLockVersion] = useState(initialLockVersion);
    const graphInitialized = useRef(false);

    const markGraphSaved = useCallback((message: string) => {
        setGraphState('saved');
        setGraphMessage(message);
    }, []);

    useEffect(() => {
        if (!graphInitialized.current) {
            graphInitialized.current = true;
            return;
        }

        setGraphState('dirty');
        setGraphMessage('Canvas changes are waiting to be saved.');
    }, [edges, nodes]);

    const onConnect: OnConnect = useCallback(
        (connection: Connection) => {
            const sourceNode = nodes.find(node => node.id === connection.source);
            const isConditionSource = isConditionNodeKind(sourceNode?.type);

            setEdges(currentEdges =>
                addEdge(
                    {
                        ...connection,
                        label: isConditionSource
                            ? conditionOutputLabel(connection.sourceHandle)
                            : undefined,
                        animated: false,
                        style: { strokeWidth: 2, stroke: '#0f5ef7' },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: '#0f5ef7',
                            width: 10,
                            height: 10,
                        },
                    },
                    currentEdges
                )
            );
        },
        [nodes, setEdges]
    );

    const addNode = useCallback(
        (
            nodeKind: Exclude<WorkflowNodeKind, 'screen' | 'if'>,
            position?: { x: number; y: number }
        ) => {
            const nextId = `${nodeKind}-${Date.now()}`;
            const labelIndex =
                nodes.filter(
                    node =>
                        node.type === nodeKind || (nodeKind === 'condition' && node.type === 'if')
                ).length + 1;

            const data =
                nodeKind === 'flash'
                    ? {
                          type: 'info' as const,
                          text: `Flash ${labelIndex}`,
                          description: '',
                      }
                    : nodeKind === 'condition'
                      ? {
                            condition: `Condition ${labelIndex}`,
                        }
                      : nodeKind === 'start'
                        ? { label: 'Start', security_rule: null }
                        : nodeKind === 'end'
                          ? { label: 'End', linked_workflow_id: null, linked_workflow_name: null }
                          : {
                                title: `Action ${labelIndex}`,
                                description: '',
                                security_rule: null,
                            };

            setNodes(currentNodes => [
                ...currentNodes,
                {
                    id: nextId,
                    type: nodeKind,
                    position: position ?? {
                        x: Math.max(160, currentNodes.length * 110),
                        y: Math.max(160, currentNodes.length * 90),
                    },
                    data,
                },
            ]);

            return nextId;
        },
        [nodes, setNodes]
    );

    const addScreenNode = useCallback(
        (position?: { x: number; y: number }) => {
            const nextId = `screen-${Date.now()}`;
            setNodes(currentNodes => [
                ...currentNodes,
                {
                    id: nextId,
                    position: position ?? {
                        x: Math.max(120, currentNodes.length * 110),
                        y: Math.max(120, currentNodes.length * 90),
                    },
                    type: 'screen',
                    data: {
                        label: `Screen ${currentNodes.length + 1}`,
                        subtitle: '',
                        security_rule: null,
                    },
                },
            ]);
            return nextId;
        },
        [setNodes]
    );

    const removeNode = useCallback(
        (nodeId: string) => {
            setNodes(currentNodes => currentNodes.filter(node => node.id !== nodeId));
            setEdges(currentEdges =>
                currentEdges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
            );
        },
        [setNodes, setEdges]
    );

    const updateNodeData = useCallback(
        (nodeId: string, patch: Partial<WorkflowNodeData>) => {
            setNodes(currentNodes =>
                currentNodes.map(node =>
                    node.id === nodeId
                        ? {
                              ...node,
                              data: {
                                  ...node.data,
                                  ...patch,
                              },
                          }
                        : node
                )
            );
        },
        [setNodes]
    );

    const updateEdgeLabel = useCallback(
        (edgeId: string, label: string | undefined) => {
            setEdges(currentEdges =>
                currentEdges.map(edge =>
                    edge.id === edgeId ? { ...edge, label: label || undefined } : edge
                )
            );
        },
        [setEdges]
    );

    const removeEdge = useCallback(
        (edgeId: string) => {
            setEdges(currentEdges => currentEdges.filter(edge => edge.id !== edgeId));
        },
        [setEdges]
    );

    const saveGraph = useCallback(
        async (source: 'ui' | 'autosave' = 'ui') => {
            if (!latestRevisionId || !canEdit) return;

            setGraphState('saving');
            setGraphMessage(
                source === 'autosave' ? 'Autosaving canvas…' : 'Saving current canvas state.'
            );

            try {
                const response = await processAtlasApi.revisions.saveGraph(latestRevisionId, {
                    graph_json: {
                        nodes,
                        edges,
                    },
                    lock_version: lockVersion,
                    source,
                });

                setLockVersion(response.data.data.lock_version);
                markGraphSaved(
                    source === 'autosave'
                        ? 'Canvas autosaved.'
                        : 'Canvas state saved to the current draft.'
                );
            } catch (error) {
                const err = error as {
                    response?: { status?: number; data?: { message?: string } };
                };
                const message =
                    err.response?.status === 409
                        ? 'A revision conflict occurred. Refresh and retry.'
                        : 'Graph save failed. Refresh and retry.';

                if (err.response?.status === 409) {
                    setGraphState('conflict');
                } else {
                    setGraphState('error');
                }

                setGraphMessage(message);
                throw error;
            }
        },
        [latestRevisionId, canEdit, nodes, edges, lockVersion, markGraphSaved]
    );

    const initializeGraph = useCallback(
        ({
            nodes: newNodes,
            edges: newEdges,
            screens,
            lockVersion: newLockVersion,
        }: {
            nodes?: Node[];
            edges?: Edge[];
            screens?: import('@/types/processAtlas').Screen[];
            lockVersion?: number;
        }) => {
            graphInitialized.current = false;
            if (newNodes !== undefined) {
                setNodes(buildInitialNodes(newNodes, screens));
            }
            if (newEdges !== undefined) {
                setEdges(
                    newEdges.map(edge => ({
                        ...edge,
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: '#0f5ef7',
                            width: 10,
                            height: 10,
                        },
                    }))
                );
            }
            if (newLockVersion !== undefined) {
                setLockVersion(newLockVersion);
            }
            setGraphState('saved');
            setGraphMessage('No pending canvas changes.');
        },
        [setNodes, setEdges]
    );

    return {
        nodes,
        edges,
        setNodes,
        setEdges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        addScreenNode,
        removeNode,
        updateNodeData,
        updateEdgeLabel,
        removeEdge,
        saveGraph,
        graphState,
        graphMessage,
        lockVersion,
        setGraphState,
        setGraphMessage,
        markGraphSaved,
        initializeGraph,
    };
}

export { isConditionNodeKind, conditionOutputLabel };
