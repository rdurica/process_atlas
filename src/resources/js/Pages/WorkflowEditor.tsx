import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import type {
    Screen,
    ScreenCustomField,
    WorkflowData,
    WorkflowRevisionSummary,
} from '@/types/processAtlas';
import { Head, Link, router } from '@inertiajs/react';
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
    OnNodesChange,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, {
    DragEvent,
    FormEvent,
    MouseEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useAutosave } from '@/hooks/useAutosave';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import ContextMenu from '../features/workflow-editor/components/ContextMenu';
import { useCopyPaste } from '../features/workflow-editor/hooks/useCopyPaste';

type WorkflowEditorProps = {
    workflow: WorkflowData;
    projectWorkflows: { id: number; name: string; status: 'draft' | 'published' }[];
    currentUserRole: 'process_owner' | 'editor' | 'viewer' | null;
};

type InspectorTab = 'screen' | 'fields' | 'general' | 'security';
type GraphState = 'saved' | 'dirty' | 'saving' | 'conflict' | 'error';
type WorkflowNodeKind = 'screen' | 'flash' | 'condition' | 'if' | 'action' | 'start' | 'end';
type FlashType = 'error' | 'warning' | 'info' | 'success';
type FieldEditorMode = 'hidden' | 'create' | 'edit';
type ScreenNodeData = Record<string, unknown> & {
    label?: string;
    subtitle?: string;
    image_url?: string | null;
    security_rule?: string | null;
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
    security_rule?: string | null;
};
type StartNodeData = Record<string, unknown> & {
    label?: string;
    security_rule?: string | null;
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
            {data.description && <p className="rf-node-body">{data.description}</p>}
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
            {data.description && <p className="rf-node-body">{data.description}</p>}
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

function StartNode({ data }: NodeProps<Node<StartNodeData>>) {
    return (
        <div className="rf-terminal-node rf-start-node">
            <span className="rf-terminal-node-icon" aria-hidden="true">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    width="12"
                    height="12"
                >
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
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        width="12"
                        height="12"
                    >
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
    const screenByNodeId = new Map(screens.map(screen => [screen.node_id, screen]));

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

    return nodes.map(node => {
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
    const response = (
        error as {
            response?: {
                status?: number;
                data?: { message?: string; errors?: Record<string, string[]> };
            };
        }
    )?.response;

    if (!response) {
        return fallback;
    }

    if (response.status === 409) {
        return response.data?.message ?? 'A revision conflict occurred. Refresh and retry.';
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

function defaultInspectorTab(nodeKind: WorkflowNodeKind): InspectorTab {
    if (nodeKind === 'screen') {
        return 'screen';
    }

    if (nodeKind === 'action' || nodeKind === 'start') {
        return 'general';
    }

    return 'general';
}

function inspectorTabsForNodeKind(nodeKind: WorkflowNodeKind): [InspectorTab, string][] {
    if (nodeKind === 'screen') {
        return [
            ['screen', 'Screen'],
            ['fields', 'Fields'],
            ['security', 'Security'],
        ];
    }

    if (nodeKind === 'action' || nodeKind === 'start') {
        return [
            ['general', 'General'],
            ['security', 'Security'],
        ];
    }

    return [];
}

function Editor({ workflow, projectWorkflows, currentUserRole }: WorkflowEditorProps) {
    const latestRevision = workflow.latest_revision;
    const isArchived = workflow.archived_at != null;
    const canEditInProject = currentUserRole === 'process_owner' || currentUserRole === 'editor';
    const canPublishWorkflows = currentUserRole === 'process_owner';
    const [previewRevision, setPreviewRevision] = useState<WorkflowRevisionSummary | null>(null);
    const canEditWorkflows =
        canEditInProject &&
        latestRevision?.is_published !== true &&
        previewRevision === null &&
        !isArchived;
    const initialNodes = useMemo(
        () => buildInitialNodes(latestRevision?.graph_json?.nodes, latestRevision?.screens ?? []),
        [latestRevision?.graph_json?.nodes, latestRevision?.screens]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const initialEdges: Edge[] = (latestRevision?.graph_json?.edges ?? []).map(edge => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#0f5ef7', width: 10, height: 10 },
    }));
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { undo, redo, canUndo, canRedo } = useCanvasHistory(nodes, edges, setNodes, setEdges);
    const [screens, setScreens] = useState<Screen[]>(latestRevision?.screens ?? []);
    const [lockVersion, setLockVersion] = useState<number>(latestRevision?.lock_version ?? 0);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
        initialNodes[0]?.id ?? null
    );
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [rollbackRevisionId, setRollbackVersionId] = useState<number | null>(
        workflow.revisions.find(revision => revision.id !== latestRevision?.id)?.id ?? null
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
    const [fieldEditorMode, setFieldEditorMode] = useState<FieldEditorMode>('hidden');
    const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
    const [newCustomKey, setNewCustomKey] = useState('');
    const [newCustomValue, setNewCustomValue] = useState('');
    const [newCustomFieldType, setNewCustomFieldType] =
        useState<ScreenCustomField['field_type']>('text');
    const graphInitialized = useRef(false);
    const contextMenuFlowPosition = useRef({ x: 0, y: 0 });
    const clearScreenAutosaveRef = useRef<(() => void) | null>(null);

    const {
        copiedNodes,
        copyNodes,
        pasteNodes,
        deleteNodes,
        isContextMenuOpen,
        contextMenuPosition,
        openContextMenu,
        closeContextMenu,
    } = useCopyPaste({ setNodes });

    const selectedNodes = useMemo(() => nodes.filter(node => node.selected), [nodes]);

    const revisions = useMemo(
        () => [...workflow.revisions].sort((a, b) => b.revision_number - a.revision_number),
        [workflow.revisions]
    );

    const selectedScreen = useMemo(
        () => screens.find(screen => screen.node_id === selectedNodeId) ?? null,
        [screens, selectedNodeId]
    );

    const selectedNode = useMemo(
        () => nodes.find(node => node.id === selectedNodeId) ?? null,
        [nodes, selectedNodeId]
    );

    const selectedNodeKind = isWorkflowNodeKind(selectedNode?.type) ? selectedNode.type : 'screen';
    const selectedNodeInspectorTabs = selectedNode
        ? inspectorTabsForNodeKind(selectedNodeKind)
        : [];

    const selectedEdge = useMemo(
        () => edges.find(edge => edge.id === selectedEdgeId) ?? null,
        [edges, selectedEdgeId]
    );

    const selectedEdgeSourceNode = useMemo(
        () => nodes.find(node => node.id === selectedEdge?.source) ?? null,
        [nodes, selectedEdge?.source]
    );

    const editingField = useMemo(
        () => selectedScreen?.custom_fields.find(field => field.id === editingFieldId) ?? null,
        [editingFieldId, selectedScreen]
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
        clearScreenAutosaveRef.current?.();
        lastSavedScreenRef.current = {
            title: selectedScreen?.title ?? '',
            subtitle: selectedScreen?.subtitle ?? '',
            description: selectedScreen?.description ?? '',
            nodeId: selectedScreen?.node_id ?? null,
        };
        setTitle(selectedScreen?.title ?? '');
        setSubtitle(selectedScreen?.subtitle ?? '');
        setDescription(selectedScreen?.description ?? '');
        setImageFile(null);
    }, [selectedScreen]);

    useEffect(() => {
        setEdgeDraftLabel(String(selectedEdge?.label ?? ''));
    }, [selectedEdge]);

    useEffect(() => {
        if (!selectedNode) {
            return;
        }

        const availableTabs = inspectorTabsForNodeKind(selectedNodeKind).map(([key]) => key);
        if (availableTabs.length === 0) {
            return;
        }

        if (!availableTabs.includes(inspectorTab)) {
            setInspectorTab(defaultInspectorTab(selectedNodeKind));
        }
    }, [inspectorTab, selectedNode, selectedNodeKind]);

    // Sync canvas state when latestRevision changes (e.g. after rollback draft is created)
    useEffect(() => {
        if (!latestRevision) return;
        graphInitialized.current = false;
        setPreviewRevision(null);
        setNodes(buildInitialNodes(latestRevision.graph_json?.nodes, latestRevision.screens ?? []));
        setEdges(
            (latestRevision.graph_json?.edges ?? []).map(edge => ({
                ...edge,
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#0f5ef7',
                    width: 10,
                    height: 10,
                },
            }))
        );
        setScreens(latestRevision.screens ?? []);
        setLockVersion(latestRevision.lock_version ?? 0);
        setGraphState('saved');
        setGraphMessage('No pending canvas changes.');
    }, [latestRevision?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!canEditWorkflows) return;

            const isCtrlOrCmd = e.ctrlKey || e.metaKey;

            if (isCtrlOrCmd && e.key === 'c' && selectedNodes.length > 0) {
                e.preventDefault();
                copyNodes(selectedNodes);
            }

            if (isCtrlOrCmd && e.key === 'v' && copiedNodes.length > 0) {
                e.preventDefault();
                pasteNodes();
            }

            if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }

            if (isCtrlOrCmd && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                redo();
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodes.length > 0) {
                e.preventDefault();
                const idsToDelete = selectedNodes.filter(n => n.type !== 'start').map(n => n.id);
                if (idsToDelete.length > 0) {
                    deleteNodes(idsToDelete);
                }
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        canEditWorkflows,
        selectedNodes,
        copiedNodes,
        copyNodes,
        pasteNodes,
        deleteNodes,
        undo,
        redo,
    ]);

    useEffect(() => {
        const handleClickOutside = () => {
            if (isContextMenuOpen) {
                closeContextMenu();
            }
        };

        if (isContextMenuOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isContextMenuOpen, closeContextMenu]);

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

    const setNodeSelected = (nodeId: string, nodeKind?: WorkflowNodeKind) => {
        const resolvedNodeKind =
            nodeKind ??
            (() => {
                const nextNode = nodes.find(node => node.id === nodeId);
                return isWorkflowNodeKind(nextNode?.type) ? nextNode.type : 'screen';
            })();

        setSelectedNodeId(nodeId);
        setSelectedEdgeId(null);
        setInspectorTab(defaultInspectorTab(resolvedNodeKind));
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

    const { screenToFlowPosition } = useReactFlow();

    const handlePaneContextMenu = useCallback(
        (event: MouseEvent) => {
            event.preventDefault();
            if (!canEditWorkflows) {
                return;
            }
            const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
            contextMenuFlowPosition.current = flowPosition;
            openContextMenu(event.clientX, event.clientY);
        },
        [canEditWorkflows, openContextMenu, screenToFlowPosition]
    );

    const handleAddElementFromContextMenu = useCallback(
        (kind: WorkflowNodeKind) => {
            const position = {
                x: contextMenuFlowPosition.current.x,
                y: contextMenuFlowPosition.current.y,
            };
            if (kind === 'screen') {
                const nextId = `screen-${Date.now()}`;
                setNodes(currentNodes => [
                    ...currentNodes,
                    {
                        id: nextId,
                        type: 'screen',
                        position,
                        data: {
                            label: `Screen ${currentNodes.length + 1}`,
                            subtitle: '',
                            security_rule: null,
                        },
                    },
                ]);
                setNodeSelected(nextId, 'screen');
            } else if (
                kind === 'flash' ||
                kind === 'condition' ||
                kind === 'action' ||
                kind === 'start' ||
                kind === 'end'
            ) {
                const nextId = `${kind}-${Date.now()}`;
                setNodes(currentNodes => {
                    const labelIndex =
                        currentNodes.filter(
                            node =>
                                node.type === kind || (kind === 'condition' && node.type === 'if')
                        ).length + 1;
                    const data =
                        kind === 'flash'
                            ? {
                                  type: 'info' as FlashType,
                                  text: `Flash ${labelIndex}`,
                                  description: '',
                              }
                            : kind === 'condition'
                              ? {
                                    condition: `Condition ${labelIndex}`,
                                }
                              : kind === 'start'
                                ? { label: 'Start', security_rule: null }
                                : kind === 'end'
                                  ? {
                                        label: 'End',
                                        linked_workflow_id: null,
                                        linked_workflow_name: null,
                                    }
                                  : {
                                        title: `Action ${labelIndex}`,
                                        description: '',
                                        security_rule: null,
                                    };
                    return [
                        ...currentNodes,
                        {
                            id: nextId,
                            type: kind,
                            position,
                            data,
                        },
                    ];
                });
                setNodeSelected(nextId, kind);
            }
            closeContextMenu();
        },
        [setNodes, setNodeSelected, closeContextMenu]
    );

    const updateSelectedNodeData = (patch: Partial<WorkflowNodeData>) => {
        if (!canEditWorkflows || !selectedNode) {
            return;
        }

        setNodes(currentNodes =>
            currentNodes.map(node =>
                node.id === selectedNode.id
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
    };

    const saveSelectedEdgeLabel = (event: FormEvent) => {
        event.preventDefault();

        if (!canEditWorkflows || !selectedEdge) {
            return;
        }

        setEdges(currentEdges =>
            currentEdges.map(edge =>
                edge.id === selectedEdge.id
                    ? {
                          ...edge,
                          label: edgeDraftLabel || undefined,
                      }
                    : edge
            )
        );

        setActionNotice('Connection label updated.');
    };

    const removeSelectedEdge = () => {
        if (!canEditWorkflows || !selectedEdge) {
            return;
        }

        setEdges(currentEdges => currentEdges.filter(edge => edge.id !== selectedEdge.id));
        setSelectedEdgeId(null);
        setActionNotice('Connection deleted.');
    };

    const markGraphSaved = (message: string) => {
        setGraphState('saved');
        setGraphMessage(message);
        setLastSavedAt(new Date().toISOString());
    };

    useAutosave({
        saveFn: async () => {
            await saveGraph('autosave');
        },
        dependencies: [nodes, edges],
        delay: 2000,
        enabled: canEditWorkflows && graphState === 'dirty',
    });

    const handleNodesChange = (changes: Parameters<typeof onNodesChange>[0]) => {
        const allowedChanges = changes.filter(change => {
            if (change.type === 'remove') {
                const node = nodes.find(n => n.id === change.id);
                return node?.type !== 'start';
            }
            return true;
        });
        onNodesChange(allowedChanges);
    };

    const handleEdgesChange = (changes: Parameters<typeof onEdgesChange>[0]) => {
        onEdgesChange(changes);
    };

    const onConnect: OnConnect = (connection: Connection) => {
        const sourceNode = nodes.find(node => node.id === connection.source);
        const isConditionSource = isConditionNodeKind(sourceNode?.type);

        setEdges(currentEdges => {
            return addEdge(
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
            );
        });
    };

    const addWorkflowNode = (
        nodeKind: Exclude<WorkflowNodeKind, 'screen' | 'if'>,
        position?: { x: number; y: number }
    ) => {
        const nextId = `${nodeKind}-${Date.now()}`;
        const labelIndex =
            nodes.filter(
                node => node.type === nodeKind || (nodeKind === 'condition' && node.type === 'if')
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

        setNodeSelected(nextId, nodeKind);
    };

    const handleDropNode = (nodeKind: WorkflowNodeKind, position: { x: number; y: number }) => {
        if (nodeKind === 'screen') {
            const nextId = `screen-${Date.now()}`;
            setNodes(currentNodes => [
                ...currentNodes,
                {
                    id: nextId,
                    type: 'screen',
                    position,
                    data: {
                        label: `Screen ${currentNodes.length + 1}`,
                        subtitle: '',
                        security_rule: null,
                    },
                },
            ]);
            setNodeSelected(nextId, 'screen');
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

    const saveGraph = async (source: 'ui' | 'autosave' = 'ui') => {
        if (!latestRevision || !canEditWorkflows) {
            return;
        }

        setGraphState('saving');
        setGraphMessage(
            source === 'autosave' ? 'Autosaving canvas…' : 'Saving current canvas state.'
        );
        setActionError(null);

        try {
            const response = await window.axios.patch(
                `/api/v1/workflow-revisions/${latestRevision.id}/graph`,
                {
                    graph_json: {
                        nodes,
                        edges,
                    },
                    lock_version: lockVersion,
                    source,
                }
            );

            setLockVersion(response.data.data.lock_version);
            markGraphSaved(
                source === 'autosave'
                    ? 'Canvas autosaved.'
                    : 'Canvas state saved to the current draft.'
            );
        } catch (error) {
            const message = resolveApiError(error, 'Graph save failed. Refresh and retry.');

            if ((error as { response?: { status?: number } })?.response?.status === 409) {
                setGraphState('conflict');
            } else {
                setGraphState('error');
            }

            setGraphMessage(message);
            setActionError(message);
            throw error;
        }
    };

    const syncScreenCollection = (updatedScreen: Screen) => {
        setScreens(current => {
            const withoutUpdated = current.filter(screen => screen.id !== updatedScreen.id);

            return [...withoutUpdated, updatedScreen];
        });

        setNodes(currentNodes =>
            currentNodes.map(node =>
                node.id === updatedScreen.node_id
                    ? {
                          ...node,
                          data: {
                              ...node.data,
                              label:
                                  updatedScreen.title || node.data?.label || updatedScreen.node_id,
                              subtitle: updatedScreen.subtitle ?? '',
                              image_url: updatedScreen.image_url ?? null,
                          },
                      }
                    : node
            )
        );
    };

    const saveScreenData = async (): Promise<Screen | null> => {
        if (!latestRevision || !selectedNodeId) {
            return null;
        }

        const form = new FormData();
        form.append('workflow_revision_id', String(latestRevision.id));
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

    const lastSavedScreenRef = useRef<{
        title: string;
        subtitle: string;
        description: string;
        nodeId: string | null;
    }>({ title: '', subtitle: '', description: '', nodeId: null });

    const { clearTimer: clearScreenAutosave } = useAutosave({
        saveFn: async () => {
            if (!latestRevision || !selectedNodeId || !canEditWorkflows) {
                return;
            }

            const last = lastSavedScreenRef.current;
            if (
                title === last.title &&
                subtitle === last.subtitle &&
                description === last.description &&
                selectedNodeId === last.nodeId
            ) {
                return;
            }

            setIsSavingScreen(true);
            setActionError(null);

            try {
                await saveScreenData();
                lastSavedScreenRef.current = {
                    title,
                    subtitle,
                    description,
                    nodeId: selectedNodeId,
                };
                setActionNotice('Screen metadata autosaved.');
            } catch (error) {
                setActionError(resolveApiError(error, 'Screen autosave failed.'));
                throw error;
            } finally {
                setIsSavingScreen(false);
            }
        },
        dependencies: [title, subtitle, description],
        delay: 1000,
        enabled: canEditWorkflows && selectedNodeId !== null,
    });

    clearScreenAutosaveRef.current = clearScreenAutosave;

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
            setActionError(resolveApiError(error, 'Screen metadata could not be saved.'));
        } finally {
            setIsSavingScreen(false);
        }
    };

    const removeWorkflowNode = (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node?.type === 'start') {
            return;
        }
        setNodes(currentNodes => currentNodes.filter(node => node.id !== nodeId));
        setEdges(currentEdges =>
            currentEdges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
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
                }
            );

            const field = response.data.data as ScreenCustomField;

            setScreens(current =>
                current.map(item => {
                    if (item.id !== screen.id) {
                        return item;
                    }

                    const withoutCurrent = item.custom_fields.filter(
                        customField => customField.id !== field.id
                    );

                    return {
                        ...item,
                        custom_fields: [...withoutCurrent, field],
                    };
                })
            );

            setNewCustomKey('');
            setNewCustomValue('');
            setNewCustomFieldType('text');
            setActionNotice('Custom field saved.');
            closeFieldEditor();
        } catch (error) {
            setActionError(resolveApiError(error, 'The custom field could not be saved.'));
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
                    }
                );

                const updated = response.data.data as ScreenCustomField;

                if (updated.id !== editingField.id) {
                    await window.axios.delete(`/api/v1/custom-fields/${editingField.id}`);
                }

                setScreens(current =>
                    current.map(screen => ({
                        ...screen,
                        custom_fields: screen.custom_fields
                            .filter(item => item.id !== editingField.id)
                            .filter(item => item.id !== updated.id)
                            .concat(updated),
                    }))
                );

                setActionNotice('Custom field saved.');
                closeFieldEditor();
            } catch (error) {
                setActionError(resolveApiError(error, 'The custom field could not be updated.'));
            }

            return;
        }

        await upsertCustomField();
    };

    const removeCustomField = async (fieldId: number): Promise<boolean> => {
        try {
            await window.axios.delete(`/api/v1/custom-fields/${fieldId}`);

            setScreens(current =>
                current.map(screen => ({
                    ...screen,
                    custom_fields: screen.custom_fields.filter(item => item.id !== fieldId),
                }))
            );

            return true;
        } catch (error) {
            setActionError(resolveApiError(error, 'The custom field could not be removed.'));

            return false;
        }
    };

    const reloadWorkflow = () => {
        router.reload({
            only: ['workflow'],
        });
    };

    const runWorkflowAction = async (task: () => Promise<void>, successMessage: string) => {
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
        if (!canEditInProject) {
            return;
        }

        await runWorkflowAction(async () => {
            await window.axios.post(`/api/v1/workflows/${workflow.id}/revisions`);
        }, 'A new draft revision was created.');
    };

    const publishCurrent = async () => {
        if (!latestRevision || !canPublishWorkflows) {
            return;
        }

        await runWorkflowAction(async () => {
            await window.axios.post(`/api/v1/workflow-revisions/${latestRevision.id}/publish`);
        }, 'The current revision was published.');
    };

    const handleRevisionTimelineClick = async (revision: WorkflowRevisionSummary) => {
        setRollbackVersionId(revision.id);

        if (latestRevision && revision.id === latestRevision.id) {
            graphInitialized.current = false;
            setPreviewRevision(null);
            setNodes(
                buildInitialNodes(latestRevision.graph_json?.nodes, latestRevision.screens ?? [])
            );
            setEdges(
                (latestRevision.graph_json?.edges ?? []).map((edge: Edge) => ({
                    ...edge,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#0f5ef7',
                        width: 10,
                        height: 10,
                    },
                }))
            );
            return;
        }

        try {
            const response = await window.axios.get<{ data: WorkflowRevisionSummary }>(
                `/api/v1/workflow-revisions/${revision.id}`
            );
            const data = response.data.data;
            graphInitialized.current = false;
            setPreviewRevision(data);
            setNodes(buildInitialNodes(data.graph_json?.nodes, data.screens ?? []));
            setEdges(
                (data.graph_json?.edges ?? []).map((edge: Edge) => ({
                    ...edge,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#0f5ef7',
                        width: 10,
                        height: 10,
                    },
                }))
            );
        } catch {
            // silently ignore preview fetch errors
        }
    };

    const deleteRevision = async (version: WorkflowRevisionSummary) => {
        await runWorkflowAction(async () => {
            await window.axios.delete(`/api/v1/workflow-revisions/${version.id}`);
        }, `rev. ${version.revision_number} was deleted.`);
    };

    const rollback = async () => {
        if (!rollbackRevisionId || !canPublishWorkflows) {
            return;
        }

        await runWorkflowAction(async () => {
            await window.axios.post(`/api/v1/workflows/${workflow.id}/rollback`, {
                to_version_id: rollbackRevisionId,
            });
        }, 'A rollback draft was created from the selected revision.');
    };

    const selectedRollbackRevision = revisions.find(revision => revision.id === rollbackRevisionId);

    return (
        <div className="workflow-fullscreen">
            <Head title={`${workflow.name} Editor`} />

            <div className="workflow-canvas-layer">
                {previewRevision && (
                    <div className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-5 py-2.5">
                        <p className="text-sm font-medium text-amber-900">
                            Viewing rev. {previewRevision.revision_number} (read-only)
                        </p>
                        {latestRevision && (
                            <button
                                type="button"
                                onClick={() => handleRevisionTimelineClick(latestRevision)}
                                className="text-sm font-semibold text-amber-700 hover:text-amber-900"
                            >
                                Return to latest
                            </button>
                        )}
                    </div>
                )}
                {isArchived && (
                    <div className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-4 border-b border-slate-200 bg-slate-100 px-5 py-2.5">
                        <p className="text-sm font-medium text-slate-700">
                            This workflow is archived and read-only.
                        </p>
                    </div>
                )}
                <FlowCanvas
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(_, node) =>
                        setNodeSelected(
                            node.id,
                            isWorkflowNodeKind(node.type) ? node.type : undefined
                        )
                    }
                    onNodeDoubleClick={(_, node) =>
                        setNodeSelected(
                            node.id,
                            isWorkflowNodeKind(node.type) ? node.type : undefined
                        )
                    }
                    onEdgeClick={(_, edge) => setEdgeSelected(edge.id)}
                    onEdgeDoubleClick={(_, edge) => setEdgeSelected(edge.id)}
                    onPaneClick={clearCanvasSelection}
                    onPaneContextMenu={handlePaneContextMenu}
                    onDropNode={handleDropNode}
                    editable={canEditWorkflows}
                />
            </div>

            <header className="workflow-topbar">
                <div className="flex min-w-0 items-center gap-3">
                    <Link
                        href={route('projects.show', workflow.project.id)}
                        className="btn-ghost workflow-action-button"
                    >
                        ← {workflow.project.name}
                    </Link>
                    <h1 className="max-w-[14rem] truncate text-base font-bold text-slate-950">
                        {workflow.name}
                    </h1>
                    <StatusBadge tone={workflowTone(workflow.status)}>
                        {workflow.status}
                    </StatusBadge>
                    {isArchived && <StatusBadge tone="neutral">Archived</StatusBadge>}
                    <StatusBadge tone={graphTone(graphState)}>{graphLabel(graphState)}</StatusBadge>
                </div>

                <div className="workflow-actions">
                    <button
                        type="button"
                        onClick={undo}
                        disabled={!canEditWorkflows || !canUndo}
                        className="btn-secondary workflow-action-button"
                        title="Undo (Ctrl+Z)"
                    >
                        &#x21B6;
                    </button>
                    <button
                        type="button"
                        onClick={redo}
                        disabled={!canEditWorkflows || !canRedo}
                        className="btn-secondary workflow-action-button"
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        &#x21B7;
                    </button>
                    <button
                        type="button"
                        onClick={() => saveGraph('ui')}
                        disabled={!canEditWorkflows || graphState === 'saving'}
                        className="btn-primary workflow-action-button"
                    >
                        Save
                    </button>
                    {graphState === 'conflict' && (
                        <button
                            type="button"
                            onClick={reloadWorkflow}
                            className="btn-warning workflow-action-button"
                        >
                            ↻ Reload Draft
                        </button>
                    )}
                    {latestRevision?.is_published && canEditInProject && !isArchived && (
                        <button
                            type="button"
                            onClick={createDraft}
                            className="btn-secondary workflow-action-button"
                        >
                            New Draft
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={publishCurrent}
                        disabled={
                            !canPublishWorkflows ||
                            latestRevision?.is_published === true ||
                            isArchived
                        }
                        className="btn-secondary workflow-action-button"
                    >
                        Publish
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

                        {selectedNode && selectedNodeInspectorTabs.length > 0 && (
                            <div
                                className="inspector-tabs mt-5"
                                style={{
                                    gridTemplateColumns: `repeat(${selectedNodeInspectorTabs.length}, minmax(0, 1fr))`,
                                }}
                            >
                                {selectedNodeInspectorTabs.map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setInspectorTab(key)}
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
                                        onChange={event => setEdgeDraftLabel(event.target.value)}
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
                                                {(selectedNode.data.type as
                                                    | FlashType
                                                    | undefined) ?? 'info'}
                                            </p>
                                        </div>

                                        <label className="block text-sm font-medium text-slate-700">
                                            Severity
                                            <select
                                                value={
                                                    (selectedNode.data.type as
                                                        | FlashType
                                                        | undefined) ?? 'info'
                                                }
                                                onChange={event =>
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
                                                    (selectedNode.data.text as
                                                        | string
                                                        | undefined) ?? ''
                                                }
                                                onChange={event =>
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
                                                onChange={event =>
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
                                                onChange={event =>
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
                                        {inspectorTab === 'general' && (
                                            <>
                                                <label className="block text-sm font-medium text-slate-700">
                                                    Title
                                                    <textarea
                                                        value={
                                                            (selectedNode.data.title as
                                                                | string
                                                                | undefined) ?? ''
                                                        }
                                                        onChange={event =>
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
                                                        onChange={event =>
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

                                        {inspectorTab === 'security' && (
                                            <div className="workflow-security-form">
                                                <label className="workflow-security-label block text-sm font-medium text-slate-700">
                                                    Security rule (additional)
                                                    <textarea
                                                        value={
                                                            (selectedNode.data.security_rule as
                                                                | string
                                                                | undefined
                                                                | null) ?? ''
                                                        }
                                                        onChange={event =>
                                                            updateSelectedNodeData({
                                                                security_rule:
                                                                    event.target.value.length > 0
                                                                        ? event.target.value
                                                                        : null,
                                                            })
                                                        }
                                                        disabled={!canEditWorkflows}
                                                        className="textarea-shell textarea-shell-security mt-2"
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </>
                                )}

                                {selectedNodeKind === 'start' && (
                                    <>
                                        {inspectorTab === 'general' && (
                                            <div className="empty-state">
                                                Entry point of the workflow — no configuration
                                                needed.
                                            </div>
                                        )}

                                        {inspectorTab === 'security' && (
                                            <div className="workflow-security-form">
                                                <label className="workflow-security-label block text-sm font-medium text-slate-700">
                                                    Security rule (additional)
                                                    <textarea
                                                        value={
                                                            (selectedNode.data.security_rule as
                                                                | string
                                                                | undefined
                                                                | null) ?? ''
                                                        }
                                                        onChange={event =>
                                                            updateSelectedNodeData({
                                                                security_rule:
                                                                    event.target.value.length > 0
                                                                        ? event.target.value
                                                                        : null,
                                                            })
                                                        }
                                                        disabled={!canEditWorkflows}
                                                        className="textarea-shell textarea-shell-security mt-2"
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </>
                                )}

                                {selectedNodeKind === 'end' && (
                                    <>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Label
                                            <input
                                                value={
                                                    (selectedNode.data.label as
                                                        | string
                                                        | undefined) ?? ''
                                                }
                                                onChange={event =>
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
                                                        | undefined) ?? ''
                                                )}
                                                onChange={event => {
                                                    const id = event.target.value
                                                        ? Number(event.target.value)
                                                        : null;
                                                    const name =
                                                        projectWorkflows.find(w => w.id === id)
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
                                                    .filter(w => w.id !== workflow.id)
                                                    .map(w => (
                                                        <option key={w.id} value={w.id}>
                                                            {w.name}
                                                            {w.status === 'published' ? ' ✓' : ''}
                                                        </option>
                                                    ))}
                                            </select>
                                        </label>
                                    </>
                                )}

                                {selectedNode.type !== 'start' && (
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
                                )}
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
                                                                        URL.createObjectURL(
                                                                            imageFile
                                                                        )
                                                                    )
                                                                }
                                                                title="Preview full image"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={2}
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                                                                    />
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
                                                                        selectedScreen.image_url!
                                                                    )
                                                                }
                                                                title="Preview full image"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={2}
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                                                                    />
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
                                                    style={{
                                                        width: '0.9rem',
                                                        height: '0.9rem',
                                                        flexShrink: 0,
                                                    }}
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
                                                    onChange={e => {
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
                                                onChange={event => setTitle(event.target.value)}
                                                className="input-shell mt-2"
                                            />
                                        </label>

                                        <label className="block text-sm font-medium text-slate-700">
                                            Subtitle
                                            <input
                                                value={subtitle}
                                                onChange={event => setSubtitle(event.target.value)}
                                                className="input-shell mt-2"
                                            />
                                        </label>

                                        <label className="block text-sm font-medium text-slate-700">
                                            Description
                                            <textarea
                                                value={description}
                                                onChange={event =>
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
                                                {(selectedScreen?.custom_fields ?? []).map(
                                                    field => (
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
                                                                    {field.value || 'No value'} /{' '}
                                                                    {field.field_type}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    )
                                                )}
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
                                                        onChange={event =>
                                                            setNewCustomKey(event.target.value)
                                                        }
                                                        className="input-shell mt-2"
                                                    />
                                                </label>

                                                <label className="block text-sm font-medium text-slate-700">
                                                    Field type
                                                    <select
                                                        value={newCustomFieldType}
                                                        onChange={event =>
                                                            setNewCustomFieldType(
                                                                event.target
                                                                    .value as ScreenCustomField['field_type']
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
                                                        onChange={event =>
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
                                                                        editingField.id
                                                                    );
                                                                if (removed) {
                                                                    setActionNotice(
                                                                        'Custom field deleted.'
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

                                {inspectorTab === 'security' && (
                                    <div className="workflow-inline-form workflow-security-form">
                                        <label className="workflow-security-label block text-sm font-medium text-slate-700">
                                            Security rule (additional)
                                            <textarea
                                                value={
                                                    (selectedNode.data.security_rule as
                                                        | string
                                                        | undefined
                                                        | null) ?? ''
                                                }
                                                onChange={event =>
                                                    updateSelectedNodeData({
                                                        security_rule:
                                                            event.target.value.length > 0
                                                                ? event.target.value
                                                                : null,
                                                    })
                                                }
                                                disabled={!canEditWorkflows}
                                                className="textarea-shell textarea-shell-security mt-2"
                                            />
                                        </label>
                                    </div>
                                )}

                                {selectedNode.type !== 'start' && (
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
                                )}
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
                        <h2 className="panel-title mt-2">Revisions & Activity</h2>
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
                        <p className="eyebrow">Revision</p>
                        <p className="mt-2 text-xl font-bold text-slate-950">
                            {latestRevision ? `rev. ${latestRevision.revision_number}` : 'N/A'}
                        </p>
                    </div>
                    <div className="workflow-metric">
                        <p className="eyebrow">Screens</p>
                        <p className="mt-2 text-xl font-bold text-slate-950">{nodes.length}</p>
                    </div>
                    <div className="workflow-metric">
                        <p className="eyebrow">Links</p>
                        <p className="mt-2 text-xl font-bold text-slate-950">{edges.length}</p>
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
                        <p className="panel-title">Revision Timeline</p>
                        {selectedRollbackRevision && (
                            <StatusBadge tone="warning">
                                Selected rev. {selectedRollbackRevision.revision_number}
                            </StatusBadge>
                        )}
                    </div>
                    <div className="mt-4 space-y-3">
                        {revisions.map(revision => {
                            const isSelected = rollbackRevisionId === revision.id;
                            const isCurrent = latestRevision?.id === revision.id;

                            return (
                                <button
                                    key={revision.id}
                                    type="button"
                                    onClick={() => handleRevisionTimelineClick(revision)}
                                    className={`version-card w-full text-left ${
                                        isSelected ? 'version-card-active' : ''
                                    }`.trim()}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-950">
                                                rev. {revision.revision_number}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {revision.creator?.name ?? 'Unknown actor'}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-start justify-end gap-2">
                                            {isCurrent && (
                                                <StatusBadge tone="brand">Current</StatusBadge>
                                            )}
                                            {revision.is_published && (
                                                <StatusBadge tone="success">Published</StatusBadge>
                                            )}
                                            {revision.rollback_from_revision_id && (
                                                <StatusBadge tone="warning">
                                                    Rollback from rev.{' '}
                                                    {workflow.revisions.find(
                                                        v =>
                                                            v.id ===
                                                            revision.rollback_from_revision_id
                                                    )?.revision_number ?? '?'}
                                                </StatusBadge>
                                            )}
                                            {canPublishWorkflows &&
                                                revisions.length > 1 &&
                                                !isArchived &&
                                                !revision.is_locked && (
                                                    <button
                                                        type="button"
                                                        disabled={isRunningAction}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            void deleteRevision(revision);
                                                        }}
                                                        className="text-xs text-slate-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                                                        title="Delete revision"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                                        {formatTimestamp(revision.created_at)}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/80 p-4">
                    <p className="text-sm font-semibold text-amber-950">Rollback target</p>
                    <p className="mt-2 text-sm text-amber-800">
                        {selectedRollbackRevision
                            ? `Create a new draft from revision ${selectedRollbackRevision.revision_number}.`
                            : 'Select a revision from the timeline to prepare rollback.'}
                    </p>
                    {rollbackRevisionId && canPublishWorkflows && !isArchived && (
                        <button
                            type="button"
                            onClick={rollback}
                            className="btn-primary mt-4 px-4 py-3 text-sm"
                        >
                            Create Rollback Draft
                        </button>
                    )}
                </div>
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
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    style={{ width: '1rem', height: '1rem' }}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
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

            {isContextMenuOpen && (
                <ContextMenu
                    position={contextMenuPosition}
                    onAddElement={handleAddElementFromContextMenu}
                    onClose={closeContextMenu}
                />
            )}
        </div>
    );
}

type FlowCanvasProps = {
    nodes: Node[];
    edges: Edge[];
    nodeTypes: Record<string, React.ComponentType<NodeProps>>;
    onNodesChange: OnNodesChange<Node>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEdgesChange: (...args: any[]) => void;
    onConnect: OnConnect;
    onNodeClick: (event: React.MouseEvent, node: Node) => void;
    onNodeDoubleClick: (event: React.MouseEvent, node: Node) => void;
    onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;
    onEdgeDoubleClick: (event: React.MouseEvent, edge: Edge) => void;
    onPaneClick: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onPaneContextMenu: (event: any) => void;
    onDropNode: (kind: WorkflowNodeKind, position: { x: number; y: number }) => void;
    onSelectionChange?: (nodes: Node[]) => void;
    editable: boolean;
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
    onPaneContextMenu,
    onDropNode,
    onSelectionChange,
    editable,
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
            onConnect={editable ? onConnect : undefined}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={editable ? onNodeDoubleClick : undefined}
            onEdgeClick={onEdgeClick}
            onEdgeDoubleClick={editable ? onEdgeDoubleClick : undefined}
            onPaneClick={onPaneClick}
            onPaneContextMenu={editable ? onPaneContextMenu : undefined}
            onSelectionChange={({ nodes: selectedNodes }) => {
                if (onSelectionChange) {
                    onSelectionChange(selectedNodes || []);
                }
            }}
            onDragOver={editable ? handleDragOver : undefined}
            onDrop={editable ? handleDrop : undefined}
            nodesDraggable={editable}
            nodesConnectable={editable}
            elementsSelectable={editable}
            fitView
            fitViewOptions={{ duration: 300 }}
        >
            <Background gap={28} size={1} color="#7aa7f7" />
            <MiniMap
                pannable
                zoomable
                position="bottom-left"
                nodeStrokeColor="#0f5ef7"
                nodeColor="#d6e7ff"
            />
            <Controls position="bottom-left" style={{ left: 180 }} />
        </ReactFlow>
    );
}

export default function WorkflowEditor(props: WorkflowEditorProps) {
    return (
        <ReactFlowProvider>
            <Editor {...props} />
        </ReactFlowProvider>
    );
}
