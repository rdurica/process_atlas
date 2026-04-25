import { useCallback, useState } from 'react';
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

const conditionOutputHandles = ['out-1', 'out-2', 'out-3', 'out-4', 'out-5'];

function isConditionNodeKind(value: string | undefined): boolean {
    return value === 'condition' || value === 'if';
}

function conditionOutputLabel(sourceHandle?: string | null): string {
    const handleNumber = Number(sourceHandle?.replace('out-', ''));
    return Number.isInteger(handleNumber) && handleNumber >= 1 && handleNumber <= 5
        ? `Output ${handleNumber}`
        : 'Output';
}

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
    onNodesChange: OnNodesChange<Node>;
    onEdgesChange: OnEdgesChange<Edge>;
    onConnect: OnConnect;
    addNode: (nodeKind: Exclude<WorkflowNodeKind, 'screen' | 'if'>) => void;
    addScreenNode: () => void;
    removeNode: (nodeId: string) => void;
    updateNodeData: (nodeId: string, patch: Partial<WorkflowNodeData>) => void;
    updateEdgeLabel: (edgeId: string, label: string | undefined) => void;
    removeEdge: (edgeId: string) => void;
    saveGraph: () => Promise<void>;
    graphState: GraphState;
    graphMessage: string;
    lockVersion: number;
    setGraphState: (state: GraphState) => void;
    setGraphMessage: (message: string) => void;
    markGraphSaved: (message: string) => void;
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

    const markGraphSaved = useCallback((message: string) => {
        setGraphState('saved');
        setGraphMessage(message);
    }, []);

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
        (nodeKind: Exclude<WorkflowNodeKind, 'screen' | 'if'>) => {
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
                    position: {
                        x: Math.max(160, currentNodes.length * 110),
                        y: Math.max(160, currentNodes.length * 90),
                    },
                    data,
                },
            ]);
        },
        [nodes, setNodes]
    );

    const addScreenNode = useCallback(() => {
        const nextId = `screen-${Date.now()}`;
        setNodes(currentNodes => [
            ...currentNodes,
            {
                id: nextId,
                position: {
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
    }, [setNodes]);

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

    const saveGraph = useCallback(async () => {
        if (!latestRevisionId || !canEdit) return;

        setGraphState('saving');
        setGraphMessage('Saving current canvas state.');

        try {
            const response = await window.axios.patch(
                `/api/v1/workflow-revisions/${latestRevisionId}/graph`,
                {
                    graph_json: {
                        nodes,
                        edges,
                    },
                    lock_version: lockVersion,
                }
            );

            setLockVersion(response.data.data.lock_version);
            markGraphSaved('Canvas state saved to the current draft.');
        } catch (error) {
            const err = error as { response?: { status?: number; data?: { message?: string } } };
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
            throw new Error(message);
        }
    }, [latestRevisionId, canEdit, nodes, edges, lockVersion, markGraphSaved]);

    return {
        nodes,
        edges,
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
    };
}

export { conditionOutputHandles, isConditionNodeKind, conditionOutputLabel };
