import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { MarkerType, useReactFlow } from '@xyflow/react';
import { useAutosave } from '@/hooks/useAutosave';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import type { WorkflowData, WorkflowRevisionSummary, Screen } from '@/types/processAtlas';
import { buildInitialNodes, resolveApiError } from '../lib/utils';
import type { WorkflowNodeKind } from '../types';
import { useCopyPaste } from './useCopyPaste';
import { useNodeSelection } from './useNodeSelection';
import { useScreenEditor } from './useScreenEditor';
import { useVersionManagement } from './useVersionManagement';
import { useWorkflowGraph } from './useWorkflowGraph';

interface UseWorkflowEditorOptions {
    workflow: WorkflowData;
    projectWorkflows: { id: number; name: string; status: 'draft' | 'published' }[];
    currentUserRole: 'process_owner' | 'editor' | 'viewer' | null;
}

export function useWorkflowEditor({
    workflow,
    projectWorkflows,
    currentUserRole,
}: UseWorkflowEditorOptions) {
    const latestRevision = workflow.latest_revision ?? null;
    const isArchived = workflow.archived_at != null;
    const canEditInProject = currentUserRole === 'process_owner' || currentUserRole === 'editor';
    const canPublishWorkflows = currentUserRole === 'process_owner';

    const {
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
        saveGraph: baseSaveGraph,
        graphState,
        graphMessage,
        lockVersion,
        markGraphSaved,
        initializeGraph,
    } = useWorkflowGraph({
        initialNodes: buildInitialNodes(
            latestRevision?.graph_json?.nodes,
            latestRevision?.screens ?? []
        ),
        initialEdges: (latestRevision?.graph_json?.edges ?? []).map(edge => ({
            ...edge,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#0f5ef7', width: 10, height: 10 },
        })),
        lockVersion: latestRevision?.lock_version ?? 0,
        latestRevisionId: latestRevision?.id ?? null,
        canEdit: canEditInProject && latestRevision?.is_published !== true && !isArchived,
    });

    const { screenToFlowPosition } = useReactFlow();

    const {
        previewRevision,
        setPreviewRevision,
        switchToDraft,
        handleRevisionTimelineClick: baseHandleRevisionTimelineClick,
    } = useVersionManagement({
        latestRevision: latestRevision as WorkflowRevisionSummary | null,
        canEditInProject,
        canPublish: canPublishWorkflows,
    });

    const canEditWorkflows =
        canEditInProject &&
        latestRevision?.is_published !== true &&
        previewRevision === null &&
        !isArchived;

    const { undo, redo, canUndo, canRedo } = useCanvasHistory(nodes, edges, setNodes, setEdges);

    const [screens, setScreens] = useState<Screen[]>(latestRevision?.screens ?? []);

    const {
        selectedNodeId,
        selectedEdgeId,
        selectedNodeKind,
        selectedNodeInspectorTabs,
        inspectorTab,
        selectNode,
        selectEdge,
        clearSelection,
        setInspectorTab,
    } = useNodeSelection({
        initialNodeId: nodes[0]?.id ?? null,
        initialEdgeId: null,
        nodes: nodes.map(n => ({ id: n.id, type: n.type })),
    });

    const selectedScreen = useMemo(
        () => screens.find(screen => screen.node_id === selectedNodeId) ?? null,
        [screens, selectedNodeId]
    );

    const selectedNode = useMemo(
        () => nodes.find(node => node.id === selectedNodeId) ?? null,
        [nodes, selectedNodeId]
    );

    const selectedEdge = useMemo(
        () => edges.find(edge => edge.id === selectedEdgeId) ?? null,
        [edges, selectedEdgeId]
    );

    const selectedEdgeSourceNode = useMemo(
        () => nodes.find(node => node.id === selectedEdge?.source) ?? null,
        [nodes, selectedEdge?.source]
    );

    const selectedNodes = useMemo(() => nodes.filter(node => node.selected), [nodes]);

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

    const [actionError, setActionError] = useState<string | null>(null);
    const [actionNotice, setActionNotice] = useState<string | null>(null);
    const [revisionsPanelOpen, setRevisionsPanelOpen] = useState(false);
    const [draftModalOpen, setDraftModalOpen] = useState(false);
    const [draftNameInput, setDraftNameInput] = useState('');
    const [draftSourceRevisionId, setDraftSourceRevisionId] = useState<number | undefined>(
        undefined
    );
    const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
    const [publishConfirmInput, setPublishConfirmInput] = useState('');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [edgeDraftLabel, setEdgeDraftLabel] = useState('');
    const contextMenuFlowPosition = useRef({ x: 0, y: 0 });

    const [activeRevisionId, setActiveRevisionId] = useState<number | null>(
        latestRevision?.id ?? null
    );

    const [editingDraftName, setEditingDraftName] = useState(latestRevision?.draft_name ?? '');

    const activeRevision = useMemo(
        () => workflow.revisions.find(r => r.id === activeRevisionId) ?? null,
        [workflow.revisions, activeRevisionId]
    );

    const screenEditor = useScreenEditor({
        screens,
        selectedNodeId,
        latestRevisionId: latestRevision?.id ?? null,
        canEdit: canEditWorkflows,
        setScreens,
        setActionError,
        setActionNotice,
        updateNodeData,
    });

    const [isRunningAction, setIsRunningAction] = useState(false);

    const reloadWorkflow = useCallback(() => {
        router.reload({ only: ['workflow'] });
    }, []);

    const runWorkflowAction = useCallback(
        async (task: () => Promise<void>, successMessage: string) => {
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
        },
        [reloadWorkflow]
    );

    const createDraft = useCallback(
        async (draftName?: string, sourceRevisionId?: number) => {
            if (!canEditInProject) return;
            await runWorkflowAction(async () => {
                await window.axios.post(`/api/v1/workflows/${workflow.id}/revisions`, {
                    draft_name: draftName || undefined,
                    source_revision_id: sourceRevisionId,
                });
            }, 'A new draft was created.');
        },
        [canEditInProject, workflow.id, runWorkflowAction]
    );

    const publishCurrent = useCallback(
        async (force = false) => {
            if (!latestRevision || !canPublishWorkflows) return;
            await runWorkflowAction(async () => {
                await window.axios.post(`/api/v1/workflow-revisions/${latestRevision.id}/publish`, {
                    force,
                });
            }, 'The current revision was published.');
        },
        [latestRevision, canPublishWorkflows, runWorkflowAction]
    );

    const deleteRevision = useCallback(
        async (revision: WorkflowRevisionSummary) => {
            await runWorkflowAction(
                async () => {
                    await window.axios.delete(`/api/v1/workflow-revisions/${revision.id}`);
                },
                revision.draft_name ?? `rev. ${revision.revision_number} was deleted.`
            );
        },
        [runWorkflowAction]
    );

    // Sync canvas state when latestRevision changes (e.g. after switching drafts)
    useEffect(() => {
        if (!latestRevision) return;
        initializeGraph({
            nodes: latestRevision.graph_json?.nodes,
            edges: latestRevision.graph_json?.edges,
            screens: latestRevision.screens ?? [],
            lockVersion: latestRevision.lock_version ?? 0,
        });
        setScreens(latestRevision.screens ?? []);
        setActiveRevisionId(latestRevision.id);
        setEditingDraftName(latestRevision.draft_name ?? '');
        setPreviewRevision(null);
    }, [latestRevision?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setEdgeDraftLabel(String(selectedEdge?.label ?? ''));
    }, [selectedEdge]);

    const handleNodesChange = useCallback(
        (changes: Parameters<typeof onNodesChange>[0]) => {
            const allowedChanges = changes.filter(change => {
                if (change.type === 'remove') {
                    const node = nodes.find(n => n.id === change.id);
                    return node?.type !== 'start';
                }
                return true;
            });
            onNodesChange(allowedChanges);
        },
        [nodes, onNodesChange]
    );

    const handlePaneContextMenu = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            if (!canEditWorkflows) return;
            const flowPosition = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            contextMenuFlowPosition.current = flowPosition;
            openContextMenu(event.clientX, event.clientY);
        },
        [canEditWorkflows, openContextMenu, screenToFlowPosition]
    );

    const handleAddElementFromContextMenu = useCallback(
        (kind: WorkflowNodeKind) => {
            if (kind === 'screen') {
                const nextId = addScreenNode(contextMenuFlowPosition.current);
                if (nextId) selectNode(nextId, 'screen');
            } else if (kind !== 'if') {
                const nextId = addNode(
                    kind as Exclude<WorkflowNodeKind, 'screen' | 'if'>,
                    contextMenuFlowPosition.current
                );
                selectNode(nextId, kind);
            }
            closeContextMenu();
        },
        [addScreenNode, addNode, closeContextMenu, selectNode]
    );

    const handleDropNode = useCallback(
        (kind: WorkflowNodeKind, position: { x: number; y: number }) => {
            if (kind === 'start') return;
            if (kind === 'screen') {
                const nextId = addScreenNode(position);
                if (nextId) selectNode(nextId, 'screen');
            } else if (kind !== 'if') {
                const nextId = addNode(
                    kind as Exclude<WorkflowNodeKind, 'screen' | 'if'>,
                    position
                );
                selectNode(nextId, kind);
            }
        },
        [addScreenNode, addNode, selectNode]
    );

    const removeWorkflowNode = useCallback(
        (nodeId: string) => {
            const node = nodes.find(n => n.id === nodeId);
            if (node?.type === 'start') return;
            removeNode(nodeId);
            clearSelection();
            setActionNotice('Node deleted.');
        },
        [nodes, removeNode, clearSelection]
    );

    const handleRevisionTimelineClick = useCallback(
        async (revision: WorkflowRevisionSummary) => {
            setActiveRevisionId(revision.id);
            if (latestRevision && revision.id === latestRevision.id) {
                initializeGraph({
                    nodes: latestRevision.graph_json?.nodes,
                    edges: latestRevision.graph_json?.edges,
                    screens: latestRevision.screens ?? [],
                    lockVersion: latestRevision.lock_version ?? 0,
                });
                setScreens(latestRevision.screens ?? []);
                setPreviewRevision(null);
                return;
            }

            if (!revision.is_published) {
                await runWorkflowAction(async () => {
                    await switchToDraft(revision);
                }, 'Switched to draft.');
                return;
            }

            await baseHandleRevisionTimelineClick(revision);
        },
        [
            latestRevision,
            baseHandleRevisionTimelineClick,
            initializeGraph,
            setPreviewRevision,
            runWorkflowAction,
            switchToDraft,
        ]
    );

    const handlePublishClick = useCallback(() => {
        if (!latestRevision || !canPublishWorkflows) return;
        const publishedRevisionId = workflow.published_revision?.id ?? null;
        const isFromLatestPublished =
            publishedRevisionId === null ||
            latestRevision.source_revision_id === publishedRevisionId;
        if (isFromLatestPublished) {
            void publishCurrent();
        } else {
            setPublishConfirmOpen(true);
        }
    }, [latestRevision, canPublishWorkflows, workflow.published_revision, publishCurrent]);

    const handleSaveDraftName = useCallback(
        async (name: string) => {
            if (!latestRevision || name === (latestRevision.draft_name ?? '')) return;
            try {
                await window.axios.patch(
                    `/api/v1/workflow-revisions/${latestRevision.id}/draft-name`,
                    { draft_name: name }
                );
                router.reload({ only: ['workflow'] });
            } catch {
                setEditingDraftName(latestRevision.draft_name ?? '');
            }
        },
        [latestRevision]
    );

    const saveSelectedEdgeLabel = useCallback(
        (event: React.FormEvent) => {
            event.preventDefault();
            if (!canEditWorkflows || !selectedEdge) return;
            updateEdgeLabel(selectedEdge.id, edgeDraftLabel || undefined);
            setActionNotice('Connection label updated.');
        },
        [canEditWorkflows, selectedEdge, edgeDraftLabel, updateEdgeLabel]
    );

    const removeSelectedEdge = useCallback(() => {
        if (!canEditWorkflows || !selectedEdge) return;
        removeEdge(selectedEdge.id);
        clearSelection();
        setActionNotice('Connection deleted.');
    }, [canEditWorkflows, selectedEdge, removeEdge, clearSelection]);

    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

    const saveGraph = useCallback(
        async (source: 'ui' | 'autosave' = 'ui') => {
            await baseSaveGraph(source);
            setLastSavedAt(new Date().toISOString());
        },
        [baseSaveGraph]
    );

    useAutosave({
        saveFn: async () => {
            await saveGraph('autosave');
        },
        dependencies: [nodes, edges],
        delay: 5000,
        minInterval: 15000,
        enabled: canEditWorkflows && graphState === 'dirty',
    });

    return {
        // Workflow data
        workflow,
        projectWorkflows,
        latestRevision,
        isArchived,
        canEditInProject,
        canPublishWorkflows,
        canEditWorkflows,

        // Graph
        nodes,
        edges,
        handleNodesChange,
        onEdgesChange,
        onConnect,
        graphState,
        graphMessage,
        lockVersion,
        saveGraph,
        markGraphSaved,
        lastSavedAt,

        // History
        undo,
        redo,
        canUndo,
        canRedo,

        // Selection
        selectedNodeId,
        selectedEdgeId,
        selectedNode,
        selectedEdge,
        selectedScreen,
        selectedNodeKind,
        selectedNodeInspectorTabs,
        selectedEdgeSourceNode,
        inspectorTab,
        selectNode,
        selectEdge,
        clearSelection,
        setInspectorTab,

        // Screens
        screens,
        setScreens,
        screenEditor,

        // Copy/paste
        copiedNodes,
        copyNodes,
        pasteNodes,
        deleteNodes,
        selectedNodes,
        isContextMenuOpen,
        contextMenuPosition,
        openContextMenu,
        closeContextMenu,
        contextMenuFlowPosition,
        handlePaneContextMenu,
        handleAddElementFromContextMenu,
        handleDropNode,
        removeWorkflowNode,

        // Node data updates
        updateNodeData,
        updateEdgeLabel,
        removeEdge,

        // Edge editing
        edgeDraftLabel,
        setEdgeDraftLabel,
        saveSelectedEdgeLabel,
        removeSelectedEdge,

        // Actions
        actionError,
        actionNotice,
        setActionError,
        setActionNotice,
        isRunningAction,
        runWorkflowAction,

        // Revisions
        revisionsPanelOpen,
        setRevisionsPanelOpen,
        activeRevisionId,
        activeRevision,
        previewRevision,
        handleRevisionTimelineClick,
        deleteRevision,
        createDraft,
        publishCurrent,
        handlePublishClick,
        editingDraftName,
        setEditingDraftName,
        handleSaveDraftName,

        // Modals
        draftModalOpen,
        setDraftModalOpen,
        draftNameInput,
        setDraftNameInput,
        draftSourceRevisionId,
        setDraftSourceRevisionId,
        publishConfirmOpen,
        setPublishConfirmOpen,
        publishConfirmInput,
        setPublishConfirmInput,

        // Image preview
        previewImageUrl,
        setPreviewImageUrl,

        // Reload
        reloadWorkflow,
    };
}
