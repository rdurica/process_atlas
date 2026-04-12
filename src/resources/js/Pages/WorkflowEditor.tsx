import ActivityFeed from '@/Components/ActivityFeed';
import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import type { PageProps } from '@/types';
import type {
    ActivityItem,
    Screen,
    ScreenCustomField,
    WorkflowData,
} from '@/types/processAtlas';
import { Head, router, usePage } from '@inertiajs/react';
import {
    addEdge,
    Background,
    Connection,
    Controls,
    Edge,
    Handle,
    MarkerType,
    MiniMap,
    Node,
    NodeProps,
    OnConnect,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type WorkflowEditorProps = {
    workflow: WorkflowData;
    recentActivity: ActivityItem[];
    projectWorkflows: { id: number; name: string; status: 'draft' | 'published' }[];
};

type InspectorTab = 'screen' | 'fields';
type GraphState = 'saved' | 'dirty' | 'saving' | 'conflict' | 'error';
type WorkflowNodeKind = 'screen' | 'flash' | 'condition' | 'if' | 'action' | 'start' | 'end';
type FlashType = 'error' | 'warning' | 'info' | 'success';
type FieldEditorMode = 'hidden' | 'create' | 'edit';
type ScreenNodeData = Record<string, unknown> & {
    label?: string;
    subtitle?: string;
    image_url?: string | null;
};
type FlashNodeData = Record<string, unknown> & {
    type?: FlashType;
    text?: string;
    description?: string;
};
type ConditionNodeData = Record<string, unknown> & {
    condition?: string;
};
type ActionNodeData = Record<string, unknown> & {
    title?: string;
    description?: string;
};
type StartNodeData = Record<string, unknown> & {
    label?: string;
};
type EndNodeData = Record<string, unknown> & {
    label?: string;
    linked_workflow_id?: number | null;
    linked_workflow_name?: string | null;
};
type WorkflowNodeData =
    | ScreenNodeData
    | FlashNodeData
    | ConditionNodeData
    | ActionNodeData
    | StartNodeData
    | EndNodeData;
type WorkflowNode = Node<WorkflowNodeData>;
const conditionOutputHandles = ['out-1', 'out-2', 'out-3', 'out-4', 'out-5'];

function ScreenNode({ data }: NodeProps<Node<ScreenNodeData>>) {
    if (data.image_url) {
        return (
            <div className="rf-screen-node rf-screen-node-image">
                <Handle type="target" position={Position.Left} />
                <div className="rf-screen-image-frame">
                    <img
                        src={data.image_url}
                        alt={data.label ?? 'Screen'}
                        className="rf-screen-image"
                    />
                    <div className="rf-screen-image-footer">
                        <span className="rf-screen-image-label">{data.label ?? 'Screen'}</span>
                        {data.subtitle && (
                            <span className="rf-screen-image-subtitle">{data.subtitle}</span>
                        )}
                    </div>
                </div>
                <Handle type="source" position={Position.Right} />
            </div>
        );
    }

    return (
        <div className="rf-screen-node">
            <Handle type="target" position={Position.Left} />
            <div className="rf-node-box">{data.label ?? 'Screen'}</div>
            {data.subtitle && <div className="rf-node-subtitle">{data.subtitle}</div>}
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

function FlashNode({ data }: NodeProps<Node<FlashNodeData>>) {
    const type = data.type ?? 'info';

    return (
        <div className={`rf-flow-node rf-flash-node rf-flash-node-${type}`}>
            <Handle type="target" position={Position.Left} />
            <p className="rf-node-kicker">{type}</p>
            <p className="rf-node-title">{data.text ?? 'Flash'}</p>
            {data.description && (
                <p className="rf-node-body">{data.description}</p>
            )}
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

function ConditionNode({ data }: NodeProps<Node<ConditionNodeData>>) {
    return (
        <div className="rf-flow-node rf-condition-node">
            <Handle type="target" position={Position.Left} />
            <p className="rf-node-kicker">condition</p>
            <p className="rf-node-title">{data.condition ?? 'Condition'}</p>
            {conditionOutputHandles.map((handleId, index) => (
                <Handle
                    key={handleId}
                    id={handleId}
                    type="source"
                    position={Position.Right}
                    className="rf-condition-output-handle"
                    style={{ top: `${((index + 1) / 6) * 100}%` }}
                />
            ))}
        </div>
    );
}

function ActionNode({ data }: NodeProps<Node<ActionNodeData>>) {
    return (
        <div className="rf-flow-node rf-action-node">
            <Handle type="target" position={Position.Left} />
            <p className="rf-node-kicker">action</p>
            <p className="rf-node-title">{data.title ?? 'Action'}</p>
            {data.description && (
                <p className="rf-node-body">{data.description}</p>
            )}
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

function StartNode({ data }: NodeProps<Node<StartNodeData>>) {
    return (
        <div className="rf-terminal-node rf-start-node">
            <span className="rf-terminal-node-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                    <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
            </span>
            <span className="rf-terminal-node-label">{data.label ?? 'Start'}</span>
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

function EndNode({ data }: NodeProps<Node<EndNodeData>>) {
    return (
        <div className="rf-terminal-node rf-end-node">
            <Handle type="target" position={Position.Left} />
            <div className="rf-terminal-node-row">
                <span className="rf-terminal-node-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                        <rect x="4" y="4" width="12" height="12" rx="2" />
                    </svg>
                </span>
                <span className="rf-terminal-node-label">{data.label ?? 'End'}</span>
            </div>
            {data.linked_workflow_name && (
                <span className="rf-end-node-chain">{data.linked_workflow_name}</span>
            )}
        </div>
    );
}

const nodeTypes = {
    screen: ScreenNode,
    flash: FlashNode,
    condition: ConditionNode,
    if: ConditionNode,
    action: ActionNode,
    start: StartNode,
    end: EndNode,
};

function buildInitialNodes(nodes: Node[] | undefined, screens: Screen[] = []): Node[] {
    const screenByNodeId = new Map(screens.map((screen) => [screen.node_id, screen]));

    if (!nodes || nodes.length === 0) {
        return [
            {
                id: 'start-1',
                type: 'start',
                data: { label: 'Start' },
                position: { x: 140, y: 200 },
            },
        ];
    }

    return nodes.map((node) => {
        const nodeType = (node.type ?? 'screen') as WorkflowNodeKind;
        const screen = nodeType === 'screen' ? screenByNodeId.get(node.id) : null;

        return {
            ...node,
            type: nodeType,
            data: {
                ...node.data,
                ...(nodeType === 'screen'
                    ? {
                          label: screen?.title || node.data?.label || node.id,
                          subtitle: screen?.subtitle ?? node.data?.subtitle ?? '',
                          image_url: screen?.image_url ?? null,
                      }
                    : {}),
            },
        };
    });
}

function resolveApiError(error: unknown, fallback: string): string {
    const response = (error as {
        response?: {
            status?: number;
            data?: { message?: string; errors?: Record<string, string[]> };
        };
    })?.response;

    if (!response) {
        return fallback;
    }

    if (response.status === 409) {
        return response.data?.message ?? 'A version conflict occurred. Refresh and retry.';
    }

    if (response.status === 403) {
        return 'You do not have permission to perform this action.';
    }

    if (response.status === 422) {
        const validationErrors = response.data?.errors;
        if (validationErrors) {
            const first = Object.values(validationErrors)[0]?.[0];
            if (first) {
                return first;
            }
        }
    }

    return response.data?.message ?? fallback;
}

function formatTimestamp(value?: string | null): string {
    if (!value) {
        return 'Unknown time';
    }

    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function graphTone(graphState: GraphState) {
    switch (graphState) {
        case 'saved':
            return 'success';
        case 'dirty':
            return 'warning';
        case 'saving':
            return 'brand';
        case 'conflict':
        case 'error':
            return 'danger';
        default:
            return 'neutral';
    }
}

function graphLabel(graphState: GraphState) {
    switch (graphState) {
        case 'saved':
            return 'Saved';
        case 'dirty':
            return 'Unsaved';
        case 'saving':
            return 'Saving';
        case 'conflict':
            return 'Conflict';
        case 'error':
            return 'Failed';
    }
}

function workflowTone(status: 'draft' | 'published') {
    return status === 'published' ? 'success' : 'warning';
}

function isWorkflowNodeKind(value: string | undefined): value is WorkflowNodeKind {
    return (
        value === 'screen' ||
        value === 'flash' ||
        value === 'condition' ||
        value === 'if' ||
        value === 'action' ||
        value === 'start' ||
        value === 'end'
    );
}

function isConditionNodeKind(value: string | undefined): boolean {
    return value === 'condition' || value === 'if';
}

function workflowNodeKindLabel(value: WorkflowNodeKind): string {
    if (value === 'if') return 'condition';
    return value;
}

function conditionOutputLabel(sourceHandle?: string | null): string {
    const handleNumber = Number(sourceHandle?.replace('out-', ''));

    return Number.isInteger(handleNumber) && handleNumber >= 1 && handleNumber <= 5
        ? `Output ${handleNumber}`
        : 'Output';
}

export default function WorkflowEditor({
    workflow,
    recentActivity,
    projectWorkflows,
}: WorkflowEditorProps) {
    const latestVersion = workflow.latest_version;
    const page = usePage<PageProps>();
    const permissions = new Set(page.props.auth.user?.permissions ?? []);
    const canEditWorkflows = permissions.has('workflows.edit');
    const canPublishWorkflows = permissions.has('workflows.publish');
    const initialNodes = useMemo(
        () =>
            buildInitialNodes(
                latestVersion?.graph_json?.nodes,
                latestVersion?.screens ?? [],
            ),
        [latestVersion?.graph_json?.nodes, latestVersion?.screens],
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const initialEdges = (latestVersion?.graph_json?.edges ?? []).map((edge) => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#0f5ef7', width: 10, height: 10 },
    }));
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [screens, setScreens] = useState<Screen[]>(latestVersion?.screens ?? []);
    const [lockVersion, setLockVersion] = useState<number>(
        latestVersion?.lock_version ?? 0,
    );
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
        initialNodes[0]?.id ?? null,
    );
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [rollbackVersionId, setRollbackVersionId] = useState<number | null>(
        workflow.versions.find((version) => version.id !== latestVersion?.id)?.id ?? null,
    );
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [inspectorTab, setInspectorTab] = useState<InspectorTab>('screen');
    const [graphState, setGraphState] = useState<GraphState>('saved');
    const [graphMessage, setGraphMessage] = useState<string>('No pending canvas changes.');
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [isSavingScreen, setIsSavingScreen] = useState(false);
    const [isRunningAction, setIsRunningAction] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionNotice, setActionNotice] = useState<string | null>(null);
    const [infoPanelOpen, setInfoPanelOpen] = useState(false);
    const [edgeDraftLabel, setEdgeDraftLabel] = useState('');
    const [fieldEditorMode, setFieldEditorMode] =
        useState<FieldEditorMode>('hidden');
    const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
    const [newCustomKey, setNewCustomKey] = useState('');
    const [newCustomValue, setNewCustomValue] = useState('');
    const [newCustomFieldType, setNewCustomFieldType] = useState<
        ScreenCustomField['field_type']
    >('text');
    const graphInitialized = useRef(false);

    const versions = useMemo(
        () => [...workflow.versions].sort((a, b) => b.version_number - a.version_number),
        [workflow.versions],
    );

    const selectedScreen = useMemo(
        () => screens.find((screen) => screen.node_id === selectedNodeId) ?? null,
        [screens, selectedNodeId],
    );

    const selectedNode = useMemo(
        () => nodes.find((node) => node.id === selectedNodeId) ?? null,
        [nodes, selectedNodeId],
    );

    const selectedNodeKind = isWorkflowNodeKind(selectedNode?.type)
        ? selectedNode.type
        : 'screen';

    const selectedEdge = useMemo(
        () => edges.find((edge) => edge.id === selectedEdgeId) ?? null,
        [edges, selectedEdgeId],
    );

    const selectedEdgeSourceNode = useMemo(
        () => nodes.find((node) => node.id === selectedEdge?.source) ?? null,
        [nodes, selectedEdge?.source],
    );

    const editingField = useMemo(
        () =>
            selectedScreen?.custom_fields.find((field) => field.id === editingFieldId) ??
            null,
        [editingFieldId, selectedScreen],
    );

    useEffect(() => {
        if (!graphInitialized.current) {
            graphInitialized.current = true;
            return;
        }

        setGraphState('dirty');
        setGraphMessage('Canvas changes are waiting to be saved.');
    }, [edges, nodes]);

    useEffect(() => {
        setTitle(selectedScreen?.title ?? '');
        setSubtitle(selectedScreen?.subtitle ?? '');
        setDescription(selectedScreen?.description ?? '');
        setImageFile(null);
    }, [selectedScreen]);

    useEffect(() => {
        setEdgeDraftLabel(String(selectedEdge?.label ?? ''));
    }, [selectedEdge]);

    const resetFieldDraft = () => {
        setEditingFieldId(null);
        setNewCustomKey('');
        setNewCustomValue('');
        setNewCustomFieldType('text');
    };

    const closeFieldEditor = () => {
        setFieldEditorMode('hidden');
        resetFieldDraft();
    };

    const openCreateFieldEditor = () => {
        resetFieldDraft();
        setFieldEditorMode('create');
        setActionError(null);
        setActionNotice(null);
    };

    const openEditFieldEditor = (field: ScreenCustomField) => {
        setEditingFieldId(field.id);
        setNewCustomKey(field.key);
        setNewCustomValue(field.value ?? '');
        setNewCustomFieldType(field.field_type);
        setFieldEditorMode('edit');
        setActionError(null);
        setActionNotice(null);
    };

    const setNodeSelected = (nodeId: string) => {
        setSelectedNodeId(nodeId);
        setSelectedEdgeId(null);
        setInspectorTab('screen');
        closeFieldEditor();
        setActionError(null);
        setActionNotice(null);
    };

    const setEdgeSelected = (edgeId: string) => {
        setSelectedEdgeId(edgeId);
        setSelectedNodeId(null);
        closeFieldEditor();
        setActionError(null);
        setActionNotice(null);
    };

    const clearCanvasSelection = () => {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        closeFieldEditor();
        setActionError(null);
        setActionNotice(null);
    };

    const updateSelectedNodeData = (patch: Partial<WorkflowNodeData>) => {
        if (!canEditWorkflows || !selectedNode) {
            return;
        }

        setNodes((currentNodes) =>
            currentNodes.map((node) =>
                node.id === selectedNode.id
                    ? {
                          ...node,
                          data: {
                              ...node.data,
                              ...patch,
                          },
                      }
                    : node,
            ),
        );
    };

    const saveSelectedEdgeLabel = (event: FormEvent) => {
        event.preventDefault();

        if (!canEditWorkflows || !selectedEdge) {
            return;
        }

        setEdges((currentEdges) =>
            currentEdges.map((edge) =>
                edge.id === selectedEdge.id
                    ? {
                          ...edge,
                          label: edgeDraftLabel || undefined,
                      }
                    : edge,
            ),
        );

        setActionNotice('Connection label updated.');
    };

    const removeSelectedEdge = () => {
        if (!canEditWorkflows || !selectedEdge) {
            return;
        }

        setEdges((currentEdges) =>
            currentEdges.filter((edge) => edge.id !== selectedEdge.id),
        );
        setSelectedEdgeId(null);
        setActionNotice('Connection deleted.');
    };

    const markGraphSaved = (message: string) => {
        setGraphState('saved');
        setGraphMessage(message);
        setLastSavedAt(new Date().toISOString());
    };

    const handleNodesChange = (changes: Parameters<typeof onNodesChange>[0]) => {
        onNodesChange(changes);
    };

    const handleEdgesChange = (changes: Parameters<typeof onEdgesChange>[0]) => {
        onEdgesChange(changes);
    };

    const onConnect: OnConnect = (connection: Connection) => {
        const sourceNode = nodes.find((node) => node.id === connection.source);
        const isConditionSource = isConditionNodeKind(sourceNode?.type);

        setEdges((currentEdges) => {
            return addEdge(
                {
                    ...connection,
                    label: isConditionSource
                        ? conditionOutputLabel(connection.sourceHandle)
                        : undefined,
                    animated: false,
                    style: { strokeWidth: 2, stroke: '#0f5ef7' },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#0f5ef7', width: 10, height: 10 },
                },
                currentEdges,
            );
        });
    };

    const addNode = () => {
        const nextId = `screen-${Date.now()}`;

        setNodes((currentNodes) => [
            ...currentNodes,
            {
                id: nextId,
                position: {
                    x: Math.max(120, currentNodes.length * 110),
                    y: Math.max(120, currentNodes.length * 90),
                },
                type: 'screen',
                data: { label: `Screen ${currentNodes.length + 1}`, subtitle: '' },
            },
        ]);

        setNodeSelected(nextId);
    };

    const addWorkflowNode = (
        nodeKind: Exclude<WorkflowNodeKind, 'screen' | 'if'>,
        position?: { x: number; y: number },
    ) => {
        const nextId = `${nodeKind}-${Date.now()}`;
        const labelIndex =
            nodes.filter(
                (node) =>
                    node.type === nodeKind ||
                    (nodeKind === 'condition' && node.type === 'if'),
            ).length + 1;
        const data =
            nodeKind === 'flash'
                ? {
                      type: 'info' as FlashType,
                      text: `Flash ${labelIndex}`,
                      description: '',
                  }
                : nodeKind === 'condition'
                  ? {
                        condition: `Condition ${labelIndex}`,
                    }
                  : nodeKind === 'start'
                    ? { label: 'Start' }
                    : nodeKind === 'end'
                      ? { label: 'End', linked_workflow_id: null, linked_workflow_name: null }
                      : {
                            title: `Action ${labelIndex}`,
                            description: '',
                        };

        setNodes((currentNodes) => [
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

        setNodeSelected(nextId);
    };

    const handleDropNode = (
        nodeKind: WorkflowNodeKind,
        position: { x: number; y: number },
    ) => {
        if (nodeKind === 'screen') {
            const nextId = `screen-${Date.now()}`;
            setNodes((currentNodes) => [
                ...currentNodes,
                {
                    id: nextId,
                    type: 'screen',
                    position,
                    data: {
                        label: `Screen ${currentNodes.length + 1}`,
                        subtitle: '',
                    },
                },
            ]);
            setNodeSelected(nextId);
        } else if (
            nodeKind === 'flash' ||
            nodeKind === 'condition' ||
            nodeKind === 'action' ||
            nodeKind === 'start' ||
            nodeKind === 'end'
        ) {
            addWorkflowNode(nodeKind, position);
        }
    };

    const saveGraph = async () => {
        if (!latestVersion || !canEditWorkflows) {
            return;
        }

        setGraphState('saving');
        setGraphMessage('Saving current canvas state.');
        setActionError(null);

        try {
            const response = await window.axios.patch(
                `/api/v1/workflow-versions/${latestVersion.id}/graph`,
                {
                    graph_json: {
                        nodes,
                        edges,
                    },
                    lock_version: lockVersion,
                },
            );

            setLockVersion(response.data.data.lock_version);
            markGraphSaved('Canvas state saved to the current draft.');
        } catch (error) {
            const message = resolveApiError(
                error,
                'Graph save failed. Refresh and retry.',
            );

            if ((error as { response?: { status?: number } })?.response?.status === 409) {
                setGraphState('conflict');
            } else {
                setGraphState('error');
            }

            setGraphMessage(message);
            setActionError(message);
        }
    };

    const syncScreenCollection = (updatedScreen: Screen) => {
        setScreens((current) => {
            const withoutUpdated = current.filter((screen) => screen.id !== updatedScreen.id);

            return [...withoutUpdated, updatedScreen];
        });

        setNodes((currentNodes) =>
            currentNodes.map((node) =>
                node.id === updatedScreen.node_id
                    ? {
                          ...node,
                          data: {
                              ...node.data,
                              label: updatedScreen.title || node.data?.label || updatedScreen.node_id,
                              subtitle: updatedScreen.subtitle ?? '',
                              image_url: updatedScreen.image_url ?? null,
                          },
                      }
                    : node,
            ),
        );
    };

    const saveScreenData = async (): Promise<Screen | null> => {
        if (!latestVersion || !selectedNodeId) {
            return null;
        }

        const form = new FormData();
        form.append('workflow_version_id', String(latestVersion.id));
        form.append('node_id', selectedNodeId);
        form.append('title', title);
        form.append('subtitle', subtitle);
        form.append('description', description);
        if (imageFile) form.append('image', imageFile);

        const response = await window.axios.post('/api/v1/screens/upsert', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        setImageFile(null);

        const updatedScreen: Screen = response.data.data;
        syncScreenCollection(updatedScreen);

        return updatedScreen;
    };

    const upsertScreen = async (event: FormEvent) => {
        event.preventDefault();

        if (!canEditWorkflows) {
            setActionError('You do not have permission to edit this workflow.');
            return;
        }

        setIsSavingScreen(true);
        setActionError(null);

        try {
            await saveScreenData();
            setActionNotice('Screen metadata saved.');
        } catch (error) {
            setActionError(
                resolveApiError(error, 'Screen metadata could not be saved.'),
            );
        } finally {
            setIsSavingScreen(false);
        }
    };

    const removeWorkflowNode = (nodeId: string) => {
        setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
        setEdges((currentEdges) =>
            currentEdges.filter(
                (edge) => edge.source !== nodeId && edge.target !== nodeId,
            ),
        );
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setActionNotice('Node deleted.');
    };

    const upsertCustomField = async () => {
        if (!newCustomKey.trim()) {
            return;
        }

        try {
            const screen = selectedScreen ?? (await saveScreenData());
            if (!screen) {
                return;
            }

            const response = await window.axios.post(
                `/api/v1/screens/${screen.id}/custom-fields/upsert`,
                {
                    key: newCustomKey,
                    value: newCustomValue || null,
                    field_type: newCustomFieldType,
                },
            );

            const field = response.data.data as ScreenCustomField;

            setScreens((current) =>
                current.map((item) => {
                    if (item.id !== screen.id) {
                        return item;
                    }

                    const withoutCurrent = item.custom_fields.filter(
                        (customField) => customField.id !== field.id,
                    );

                    return {
                        ...item,
                        custom_fields: [...withoutCurrent, field],
                    };
                }),
            );

            setNewCustomKey('');
            setNewCustomValue('');
            setNewCustomFieldType('text');
            setActionNotice('Custom field saved.');
            closeFieldEditor();
        } catch (error) {
            setActionError(
                resolveApiError(error, 'The custom field could not be saved.'),
            );
        }
    };

    const submitFieldEditor = async (event: FormEvent) => {
        event.preventDefault();

        if (!canEditWorkflows || !newCustomKey.trim()) {
            return;
        }

        if (fieldEditorMode === 'edit' && editingField) {
            if (!selectedScreen) {
                return;
            }

            try {
                const response = await window.axios.post(
                    `/api/v1/screens/${selectedScreen.id}/custom-fields/upsert`,
                    {
                        key: newCustomKey,
                        value: newCustomValue || null,
                        field_type: newCustomFieldType,
                        sort_order: editingField.sort_order,
                    },
                );

                const updated = response.data.data as ScreenCustomField;

                if (updated.id !== editingField.id) {
                    await window.axios.delete(`/api/v1/custom-fields/${editingField.id}`);
                }

                setScreens((current) =>
                    current.map((screen) => ({
                        ...screen,
                        custom_fields: screen.custom_fields
                            .filter((item) => item.id !== editingField.id)
                            .filter((item) => item.id !== updated.id)
                            .concat(updated),
                    })),
                );

                setActionNotice('Custom field saved.');
                closeFieldEditor();
            } catch (error) {
                setActionError(
                    resolveApiError(error, 'The custom field could not be updated.'),
                );
            }

            return;
        }

        await upsertCustomField();
    };

    const removeCustomField = async (fieldId: number): Promise<boolean> => {
        try {
            await window.axios.delete(`/api/v1/custom-fields/${fieldId}`);

            setScreens((current) =>
                current.map((screen) => ({
                    ...screen,
                    custom_fields: screen.custom_fields.filter(
                        (item) => item.id !== fieldId,
                    ),
                })),
            );

            return true;
        } catch (error) {
            setActionError(
                resolveApiError(error, 'The custom field could not be removed.'),
            );

            return false;
        }
    };

    const reloadWorkflow = () => {
        router.reload({
            only: ['workflow', 'recentActivity'],
        });
    };

    const runWorkflowAction = async (
        task: () => Promise<void>,
        successMessage: string,
    ) => {
        setIsRunningAction(true);
        setActionError(null);
        setActionNotice(null);

        try {
            await task();
            setActionNotice(successMessage);
            reloadWorkflow();
        } catch (error) {
            setActionError(resolveApiError(error, 'The workflow action failed.'));
        } finally {
            setIsRunningAction(false);
        }
    };

    const createDraft = async () => {
        if (!canEditWorkflows) {
            return;
        }

        await runWorkflowAction(
            async () => {
                await window.axios.post(`/api/v1/workflows/${workflow.id}/versions`);
            },
            'A new draft version was created.',
        );
    };

    const publishCurrent = async () => {
        if (!latestVersion || !canPublishWorkflows) {
            return;
        }

        await runWorkflowAction(
            async () => {
                await window.axios.post(
                    `/api/v1/workflow-versions/${latestVersion.id}/publish`,
                );
            },
            'The current version was published.',
        );
    };

    const rollback = async () => {
        if (!rollbackVersionId || !canPublishWorkflows) {
            return;
        }

        await runWorkflowAction(
            async () => {
                await window.axios.post(`/api/v1/workflows/${workflow.id}/rollback`, {
                    to_version_id: rollbackVersionId,
                });
            },
            'A rollback draft was created from the selected version.',
        );
    };

    const selectedRollbackVersion = versions.find(
        (version) => version.id === rollbackVersionId,
    );

    return (
        <div className="workflow-fullscreen">
            <Head title={`${workflow.name} Editor`} />

            <div className="workflow-canvas-layer">
                <ReactFlowProvider>
                    <FlowCanvas
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={handleNodesChange}
                        onEdgesChange={handleEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={(_, node) => setNodeSelected(node.id)}
                        onNodeDoubleClick={(_, node) => setNodeSelected(node.id)}
                        onEdgeClick={(_, edge) => setEdgeSelected(edge.id)}
                        onEdgeDoubleClick={(_, edge) => setEdgeSelected(edge.id)}
                        onPaneClick={clearCanvasSelection}
                        onDropNode={handleDropNode}
                    />
                </ReactFlowProvider>
            </div>

            <header className="workflow-topbar">
                <div className="flex items-center gap-3 min-w-0">
                    <h1 className="truncate text-base font-bold text-slate-950 max-w-[14rem]">
                        {workflow.name}
                    </h1>
                    <StatusBadge tone={workflowTone(workflow.status)}>
                        {workflow.status}
                    </StatusBadge>
                    <StatusBadge tone={graphTone(graphState)}>
                        {graphLabel(graphState)}
                    </StatusBadge>
                </div>

                <div className="workflow-actions">
                    <button
                        type="button"
                        onClick={saveGraph}
                        disabled={!canEditWorkflows || graphState === 'saving'}
                        className="btn-primary workflow-action-button"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={() => setInfoPanelOpen(true)}
                        className="btn-secondary workflow-action-button"
                    >
                        Details
                    </button>
                </div>
            </header>

            <aside className="workflow-node-toolbar" aria-label="Add workflow node">
                <p className="eyebrow">Add</p>
                {(
                    [
                        ['screen', 'Screen'],
                        ['flash', 'Flash'],
                        ['condition', 'Condition'],
                        ['action', 'Action'],
                    ] as [WorkflowNodeKind, string][]
                ).map(([kind, label]) => (
                    <div
                        key={kind}
                        draggable={canEditWorkflows}
                        onDragStart={(e: DragEvent<HTMLDivElement>) => {
                            e.dataTransfer.setData(
                                'application/reactflow',
                                kind,
                            );
                            e.dataTransfer.effectAllowed = 'move';
                        }}
                        aria-disabled={!canEditWorkflows}
                        className="workflow-node-toolbar-button"
                    >
                        {label}
                    </div>
                ))}
                <hr className="workflow-node-toolbar-divider" />
                <p className="eyebrow">Terminals</p>
                {(
                    [
                        ['start', 'Start'],
                        ['end', 'End'],
                    ] as [WorkflowNodeKind, string][]
                ).map(([kind, label]) => (
                    <div
                        key={kind}
                        draggable={canEditWorkflows}
                        onDragStart={(e: DragEvent<HTMLDivElement>) => {
                            e.dataTransfer.setData(
                                'application/reactflow',
                                kind,
                            );
                            e.dataTransfer.effectAllowed = 'move';
                        }}
                        aria-disabled={!canEditWorkflows}
                        className="workflow-node-toolbar-button"
                    >
                        {label}
                    </div>
                ))}
            </aside>

            {(selectedEdge || selectedNode) && (
                <aside className="workflow-inspector-panel">
                    <section>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="eyebrow">Inspector</p>
                                <h2 className="panel-title mt-2">
                                    {selectedEdge ? 'Connection' : selectedNode?.id}
                                </h2>
                            </div>
                            {selectedEdge ? (
                                <StatusBadge tone="brand">Edge</StatusBadge>
                            ) : selectedScreen ? (
                                <StatusBadge tone="brand">Saved Screen</StatusBadge>
                            ) : selectedNode ? (
                                <StatusBadge tone="neutral">
                                    {workflowNodeKindLabel(selectedNodeKind)}
                                </StatusBadge>
                            ) : null}
                        </div>

                        {selectedNodeKind === 'screen' && selectedNode && (
                            <div className="inspector-tabs mt-5">
                                {[
                                    ['screen', 'Screen'],
                                    ['fields', 'Fields'],
                                ].map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setInspectorTab(key as InspectorTab)}
                                        className={`inspector-tab ${
                                            inspectorTab === key ? 'inspector-tab-active' : ''
                                        }`.trim()}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedEdge ? (
                        <form
                            onSubmit={saveSelectedEdgeLabel}
                            className="workflow-inline-form mt-5"
                        >
                            <div className="workflow-text-row workflow-field-row">
                                <p className="workflow-text-row-title">
                                    {selectedEdge.source} to {selectedEdge.target}
                                </p>
                                <p className="workflow-text-row-meta">
                                    {isConditionNodeKind(selectedEdgeSourceNode?.type)
                                        ? 'Condition branch'
                                        : 'Connection'}
                                </p>
                            </div>

                            <label className="block text-sm font-medium text-slate-700">
                                Label
                                <input
                                    value={edgeDraftLabel}
                                    onChange={(event) =>
                                        setEdgeDraftLabel(event.target.value)
                                    }
                                    disabled={!canEditWorkflows}
                                    className="input-shell mt-2"
                                />
                            </label>

                            <div className="workflow-inline-actions">
                                <button
                                    type="button"
                                    onClick={removeSelectedEdge}
                                    disabled={!canEditWorkflows}
                                    className="btn-danger workflow-action-button"
                                >
                                    Delete
                                </button>
                                <button
                                    type="submit"
                                    disabled={!canEditWorkflows}
                                    className="btn-primary workflow-action-button"
                                >
                                    Save Label
                                </button>
                            </div>
                        </form>
                    ) : selectedNode && selectedNodeKind !== 'screen' ? (
                        <div className="workflow-inline-form mt-5">
                            {selectedNodeKind === 'flash' && (
                                <>
                                    <div
                                        className={`workflow-text-row workflow-flash-row-${
                                            (selectedNode.data.type as FlashType | undefined) ??
                                            'info'
                                        }`}
                                    >
                                        <p className="workflow-text-row-title">
                                            {(selectedNode.data.text as string | undefined) ??
                                                'Flash'}
                                        </p>
                                        <p className="workflow-text-row-meta">
                                            {(selectedNode.data.type as FlashType | undefined) ??
                                                'info'}
                                        </p>
                                    </div>

                                    <label className="block text-sm font-medium text-slate-700">
                                        Severity
                                        <select
                                            value={
                                                (selectedNode.data.type as FlashType | undefined) ??
                                                'info'
                                            }
                                            onChange={(event) =>
                                                updateSelectedNodeData({
                                                    type: event.target.value as FlashType,
                                                })
                                            }
                                            disabled={!canEditWorkflows}
                                            className="select-shell mt-2"
                                        >
                                            <option value="error">Error</option>
                                            <option value="warning">Warning</option>
                                            <option value="info">Info</option>
                                            <option value="success">Success</option>
                                        </select>
                                    </label>

                                    <label className="block text-sm font-medium text-slate-700">
                                        Text
                                        <textarea
                                            value={
                                                (selectedNode.data.text as string | undefined) ??
                                                ''
                                            }
                                            onChange={(event) =>
                                                updateSelectedNodeData({
                                                    text: event.target.value,
                                                })
                                            }
                                            disabled={!canEditWorkflows}
                                            className="textarea-shell mt-2"
                                        />
                                    </label>

                                    <label className="block text-sm font-medium text-slate-700">
                                        Description
                                        <textarea
                                            value={
                                                (selectedNode.data.description as
                                                    | string
                                                    | undefined) ?? ''
                                            }
                                            onChange={(event) =>
                                                updateSelectedNodeData({
                                                    description: event.target.value,
                                                })
                                            }
                                            disabled={!canEditWorkflows}
                                            className="textarea-shell textarea-shell-compact mt-2"
                                        />
                                    </label>
                                </>
                            )}

                            {isConditionNodeKind(selectedNodeKind) && (
                                <>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Condition
                                        <textarea
                                            value={
                                                (selectedNode.data.condition as
                                                    | string
                                                    | undefined) ?? ''
                                            }
                                            onChange={(event) =>
                                                updateSelectedNodeData({
                                                    condition: event.target.value,
                                                })
                                            }
                                            disabled={!canEditWorkflows}
                                            className="textarea-shell mt-2"
                                        />
                                    </label>

                                    <div className="empty-state">
                                        Select an outgoing connection on the canvas to edit its
                                        label.
                                    </div>
                                </>
                            )}

                            {selectedNodeKind === 'action' && (
                                <>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Title
                                        <textarea
                                            value={
                                                (selectedNode.data.title as string | undefined) ??
                                                ''
                                            }
                                            onChange={(event) =>
                                                updateSelectedNodeData({
                                                    title: event.target.value,
                                                })
                                            }
                                            disabled={!canEditWorkflows}
                                            className="textarea-shell mt-2"
                                        />
                                    </label>

                                    <label className="block text-sm font-medium text-slate-700">
                                        Description
                                        <textarea
                                            value={
                                                (selectedNode.data.description as
                                                    | string
                                                    | undefined) ?? ''
                                            }
                                            onChange={(event) =>
                                                updateSelectedNodeData({
                                                    description: event.target.value,
                                                })
                                            }
                                            disabled={!canEditWorkflows}
                                            className="textarea-shell textarea-shell-compact mt-2"
                                        />
                                    </label>
                                </>
                            )}

                            {selectedNodeKind === 'start' && (
                                <div className="empty-state">
                                    Entry point of the workflow — no configuration needed.
                                </div>
                            )}

                            {selectedNodeKind === 'end' && (
                                <>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Label
                                        <input
                                            value={
                                                (selectedNode.data.label as string | undefined) ??
                                                ''
                                            }
                                            onChange={(event) =>
                                                updateSelectedNodeData({
                                                    label: event.target.value,
                                                })
                                            }
                                            disabled={!canEditWorkflows}
                                            className="input-shell mt-2"
                                        />
                                    </label>

                                    <label className="block text-sm font-medium text-slate-700">
                                        Chain to workflow
                                        <select
                                            value={String(
                                                (selectedNode.data.linked_workflow_id as
                                                    | number
                                                    | null
                                                    | undefined) ?? '',
                                            )}
                                            onChange={(event) => {
                                                const id = event.target.value
                                                    ? Number(event.target.value)
                                                    : null;
                                                const name =
                                                    projectWorkflows.find((w) => w.id === id)
                                                        ?.name ?? null;
                                                updateSelectedNodeData({
                                                    linked_workflow_id: id,
                                                    linked_workflow_name: name,
                                                });
                                            }}
                                            disabled={!canEditWorkflows}
                                            className="select-shell mt-2"
                                        >
                                            <option value="">— None —</option>
                                            {projectWorkflows
                                                .filter((w) => w.id !== workflow.id)
                                                .map((w) => (
                                                    <option key={w.id} value={w.id}>
                                                        {w.name}
                                                        {w.status === 'published' ? ' ✓' : ''}
                                                    </option>
                                                ))}
                                        </select>
                                    </label>
                                </>
                            )}

                            <div className="workflow-inline-actions">
                                <button
                                    type="button"
                                    onClick={() => removeWorkflowNode(selectedNode.id)}
                                    disabled={!canEditWorkflows}
                                    className="btn-danger workflow-wide-button"
                                >
                                    Delete Node
                                </button>
                            </div>
                        </div>
                    ) : selectedNode ? (
                        <div className="mt-5 space-y-5">
                            {inspectorTab === 'screen' && (
                                <form onSubmit={upsertScreen} className="space-y-4">
                                    <div className="screen-phone-mockup">
                                        <div className="screen-phone-frame">
                                            <div className="screen-phone-notch" />
                                            <div className="screen-phone-display">
                                                {imageFile ? (
                                                    <>
                                                        <img
                                                            src={URL.createObjectURL(imageFile)}
                                                            alt="Screen preview"
                                                            className="screen-phone-image-fill"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="screen-phone-zoom-btn"
                                                            onClick={() =>
                                                                setPreviewImageUrl(
                                                                    URL.createObjectURL(imageFile),
                                                                )
                                                            }
                                                            title="Preview full image"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                ) : selectedScreen?.image_url ? (
                                                    <>
                                                        <img
                                                            src={selectedScreen.image_url}
                                                            alt="Screen preview"
                                                            className="screen-phone-image-fill"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="screen-phone-zoom-btn"
                                                            onClick={() =>
                                                                setPreviewImageUrl(
                                                                    selectedScreen.image_url!,
                                                                )
                                                            }
                                                            title="Preview full image"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="screen-phone-placeholder">
                                                        <svg
                                                            className="screen-phone-placeholder-icon"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={1.5}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5A.75.75 0 0121 3.75v13.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 17.25V3.75A.75.75 0 013.75 3z"
                                                            />
                                                        </svg>
                                                        No image
                                                    </div>
                                                )}
                                                {(title || subtitle) && (
                                                    <div className="screen-phone-meta-overlay">
                                                        {title && (
                                                            <p className="screen-phone-meta-title">
                                                                {title}
                                                            </p>
                                                        )}
                                                        {subtitle && (
                                                            <p className="screen-phone-meta-subtitle">
                                                                {subtitle}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="screen-image-upload-area">
                                        <label className="screen-image-upload-label">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                                style={{ width: '0.9rem', height: '0.9rem', flexShrink: 0 }}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                                                />
                                            </svg>
                                            {imageFile ? 'Change image' : 'Upload screen image'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                disabled={!canEditWorkflows}
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] ?? null;
                                                    setImageFile(file);
                                                }}
                                            />
                                        </label>
                                        {imageFile && (
                                            <span className="screen-image-selected-name">
                                                {imageFile.name}
                                            </span>
                                        )}
                                    </div>

                                    <label className="block text-sm font-medium text-slate-700">
                                        Title
                                        <input
                                            value={title}
                                            onChange={(event) => setTitle(event.target.value)}
                                            className="input-shell mt-2"
                                        />
                                    </label>

                                    <label className="block text-sm font-medium text-slate-700">
                                        Subtitle
                                        <input
                                            value={subtitle}
                                            onChange={(event) => setSubtitle(event.target.value)}
                                            className="input-shell mt-2"
                                        />
                                    </label>

                                    <label className="block text-sm font-medium text-slate-700">
                                        Description
                                        <textarea
                                            value={description}
                                            onChange={(event) =>
                                                setDescription(event.target.value)
                                            }
                                            className="textarea-shell textarea-shell-large mt-2"
                                        />
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={!canEditWorkflows || isSavingScreen}
                                        className="btn-primary workflow-wide-button"
                                    >
                                        Save Screen
                                    </button>
                                </form>
                            )}

                            {inspectorTab === 'fields' && (
                                <div className="workflow-compact-list">
                                    {(selectedScreen?.custom_fields ?? []).length > 0 ? (
                                        <div className="space-y-2">
                                            {(selectedScreen?.custom_fields ?? []).map((field) => (
                                                <button
                                                    key={field.id}
                                                    type="button"
                                                    className={`workflow-text-row workflow-field-row w-full text-left ${
                                                        editingFieldId === field.id
                                                            ? 'workflow-field-row-active'
                                                            : ''
                                                    }`.trim()}
                                                    onClick={() => {
                                                        if (canEditWorkflows) {
                                                            openEditFieldEditor(field);
                                                        }
                                                    }}
                                                    disabled={!canEditWorkflows}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="workflow-text-row-title">
                                                            {field.key}
                                                        </p>
                                                        <p className="workflow-text-row-meta">
                                                            {field.value || 'No value'} / {field.field_type}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            No custom fields on this screen yet.
                                        </div>
                                    )}

                                    {fieldEditorMode === 'hidden' ? (
                                        <button
                                            type="button"
                                            onClick={openCreateFieldEditor}
                                            disabled={!canEditWorkflows}
                                            className="btn-secondary workflow-wide-button"
                                        >
                                            Add Field
                                        </button>
                                    ) : (
                                        <form
                                            onSubmit={submitFieldEditor}
                                            className="workflow-inline-form"
                                        >
                                            <div>
                                                <p className="eyebrow">Custom Field</p>
                                                <h3 className="mt-1 text-sm font-bold text-slate-950">
                                                    {fieldEditorMode === 'edit'
                                                        ? 'Edit Field'
                                                        : 'Add Field'}
                                                </h3>
                                            </div>

                                            <label className="block text-sm font-medium text-slate-700">
                                                Field key
                                                <input
                                                    value={newCustomKey}
                                                    onChange={(event) =>
                                                        setNewCustomKey(event.target.value)
                                                    }
                                                    className="input-shell mt-2"
                                                />
                                            </label>

                                            <label className="block text-sm font-medium text-slate-700">
                                                Field type
                                                <select
                                                    value={newCustomFieldType}
                                                    onChange={(event) =>
                                                        setNewCustomFieldType(
                                                            event.target
                                                                .value as ScreenCustomField['field_type'],
                                                        )
                                                    }
                                                    className="select-shell mt-2"
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="boolean">Boolean</option>
                                                    <option value="json">JSON</option>
                                                </select>
                                            </label>

                                            <label className="block text-sm font-medium text-slate-700">
                                                Field value
                                                <textarea
                                                    value={newCustomValue}
                                                    onChange={(event) =>
                                                        setNewCustomValue(event.target.value)
                                                    }
                                                    className="textarea-shell mt-2"
                                                />
                                            </label>

                                            <div className="workflow-inline-actions">
                                                {fieldEditorMode === 'edit' && editingField && (
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            const removed =
                                                                await removeCustomField(
                                                                    editingField.id,
                                                                );
                                                            if (removed) {
                                                                setActionNotice(
                                                                    'Custom field deleted.',
                                                                );
                                                                closeFieldEditor();
                                                            }
                                                        }}
                                                        disabled={!canEditWorkflows}
                                                        className="btn-danger workflow-action-button"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={closeFieldEditor}
                                                    className="btn-secondary workflow-action-button"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={
                                                        !canEditWorkflows ||
                                                        !newCustomKey.trim()
                                                    }
                                                    className="btn-primary workflow-action-button"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            <div className="workflow-inline-actions">
                                <button
                                    type="button"
                                    onClick={() => removeWorkflowNode(selectedNode.id)}
                                    disabled={!canEditWorkflows}
                                    className="btn-danger workflow-wide-button"
                                >
                                    Delete Node
                                </button>
                            </div>
                        </div>
                    ) : null}
                    </section>
                </aside>
            )}

            {infoPanelOpen && (
                <button
                    type="button"
                    className="workflow-panel-backdrop"
                    onClick={() => setInfoPanelOpen(false)}
                    aria-label="Close workflow details"
                />
            )}

            <aside
                className={`workflow-info-panel ${
                    infoPanelOpen ? 'workflow-info-panel-open' : ''
                }`.trim()}
                aria-hidden={!infoPanelOpen}
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="eyebrow">Workflow Metadata</p>
                        <h2 className="panel-title mt-2">Versions & Activity</h2>
                    </div>
                    <button
                        type="button"
                        className="workflow-panel-close"
                        onClick={() => setInfoPanelOpen(false)}
                    >
                        Close
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="workflow-metric">
                        <p className="eyebrow">Version</p>
                        <p className="mt-2 text-xl font-bold text-slate-950">
                            {latestVersion ? `v${latestVersion.version_number}` : 'N/A'}
                        </p>
                    </div>
                    <div className="workflow-metric">
                        <p className="eyebrow">Screens</p>
                        <p className="mt-2 text-xl font-bold text-slate-950">
                            {nodes.length}
                        </p>
                    </div>
                    <div className="workflow-metric">
                        <p className="eyebrow">Links</p>
                        <p className="mt-2 text-xl font-bold text-slate-950">
                            {edges.length}
                        </p>
                    </div>
                </div>

                <div className="mt-5 rounded-lg border border-slate-200 bg-white/85 p-4 text-sm text-slate-600">
                    <p>{graphMessage}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                        {lastSavedAt
                            ? `Last graph save ${formatTimestamp(lastSavedAt)}`
                            : 'No graph save recorded in this session'}
                    </p>
                </div>

                <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                        <p className="panel-title">Version Timeline</p>
                        {selectedRollbackVersion && (
                            <StatusBadge tone="warning">
                                Selected v{selectedRollbackVersion.version_number}
                            </StatusBadge>
                        )}
                    </div>
                    <div className="mt-4 space-y-3">
                        {versions.map((version) => {
                            const isSelected = rollbackVersionId === version.id;
                            const isCurrent = latestVersion?.id === version.id;

                            return (
                                <button
                                    key={version.id}
                                    type="button"
                                    onClick={() => setRollbackVersionId(version.id)}
                                    className={`version-card w-full text-left ${
                                        isSelected ? 'version-card-active' : ''
                                    }`.trim()}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-950">
                                                Version {version.version_number}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {version.creator?.name ?? 'Unknown actor'}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap justify-end gap-2">
                                            {isCurrent && (
                                                <StatusBadge tone="brand">
                                                    Current
                                                </StatusBadge>
                                            )}
                                            {version.is_published && (
                                                <StatusBadge tone="success">
                                                    Published
                                                </StatusBadge>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                                        {formatTimestamp(version.created_at)}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/80 p-4">
                    <p className="text-sm font-semibold text-amber-950">
                        Rollback target
                    </p>
                    <p className="mt-2 text-sm text-amber-800">
                        {selectedRollbackVersion
                            ? `Create a new draft from version ${selectedRollbackVersion.version_number}.`
                            : 'Select a version from the timeline to prepare rollback.'}
                    </p>
                </div>

                <ActivityFeed
                    className="mt-5 shadow-none"
                    items={recentActivity}
                    emptyMessage="Workflow actions will appear here once edits, versions, and publishes happen."
                />
            </aside>

            {(actionError || actionNotice) && (
                <div
                    className={`workflow-toast ${
                        actionError ? 'workflow-toast-error' : 'workflow-toast-notice'
                    }`.trim()}
                >
                    {actionError || actionNotice}
                </div>
            )}

            <Modal
                show={previewImageUrl !== null}
                maxWidth="2xl"
                onClose={() => setPreviewImageUrl(null)}
            >
                {previewImageUrl && (
                    <div className="screen-preview-modal">
                        <div className="screen-preview-modal-header">
                            <span className="screen-preview-modal-title">Screen Preview</span>
                            <button
                                type="button"
                                className="screen-preview-modal-close"
                                onClick={() => setPreviewImageUrl(null)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '1rem', height: '1rem' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Close
                            </button>
                        </div>
                        <img
                            src={previewImageUrl}
                            alt="Screen preview"
                            className="screen-preview-modal-image"
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}

type FlowCanvasProps = {
    nodes: Node[];
    edges: Edge[];
    nodeTypes: Record<string, React.ComponentType<NodeProps>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onNodesChange: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEdgesChange: (...args: any[]) => void;
    onConnect: OnConnect;
    onNodeClick: (event: React.MouseEvent, node: Node) => void;
    onNodeDoubleClick: (event: React.MouseEvent, node: Node) => void;
    onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;
    onEdgeDoubleClick: (event: React.MouseEvent, edge: Edge) => void;
    onPaneClick: () => void;
    onDropNode: (kind: WorkflowNodeKind, position: { x: number; y: number }) => void;
};

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
    onDropNode,
}: FlowCanvasProps) {
    const { screenToFlowPosition } = useReactFlow();

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const kind = e.dataTransfer.getData('application/reactflow') as WorkflowNodeKind;
        if (!kind) return;
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        onDropNode(kind, position);
    };

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onPaneClick={onPaneClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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
            <Controls position="bottom-center" />
        </ReactFlow>
    );
}
