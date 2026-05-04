import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { MarkerType, useReactFlow } from '@xyflow/react';
import { useAutosave } from '@/hooks/useAutosave';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import type { WorkflowData, WorkflowRevisionSummary, Screen } from '@/types/processAtlas';
import { buildInitialNodes } from '../lib/utils';
import { processAtlasApi } from '@/shared/api/processAtlasApi';
import { resolveApiError } from '@/shared/lib/apiErrors';
import type { WorkflowNodeKind } from '../types';
import { useCopyPaste } from './useCopyPaste';
import { useNodeSelection } from './useNodeSelection';
import { useScreenEditor } from './useScreenEditor';
import { useVersionManagement } from './useVersionManagement';
import { useWorkflowGraph } from './useWorkflowGraph';
import { useEditorStore } from '../stores/editorStore';

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

    // Stable ref to store actions (actions never change identity in Zustand)
    const storeRef = useRef(useEditorStore.getState());

    // Initialize permissions on mount / when role changes
    useEffect(() => {
        storeRef.current.initPermissions(currentUserRole, latestRevision, isArchived);
        // Only depend on ID to avoid re-initializing when the same revision's data is updated.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserRole, latestRevision?.id, isArchived]);

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
        dirtyCounter,
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

    useEffect(() => {
        storeRef.current.setCanEditWorkflows(canEditWorkflows);
    }, [canEditWorkflows]);

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

    const contextMenuFlowPosition = useRef({ x: 0, y: 0 });

    const activeRevision = useMemo(
        () => workflow.revisions.find(r => r.id === storeRef.current.activeRevisionId) ?? null,
        [workflow.revisions]
    );

    const screenEditor = useScreenEditor({
        screens,
        selectedNodeId,
        latestRevisionId: latestRevision?.id ?? null,
        canEdit: canEditWorkflows,
        setScreens,
        setActionError: storeRef.current.setActionError,
        setActionNotice: storeRef.current.setActionNotice,
        updateNodeData,
    });

    const reloadWorkflow = useCallback(() => {
        router.reload({ only: ['workflow'] });
    }, []);

    const runWorkflowAction = useCallback(
        async (task: () => Promise<void>, successMessage: string) => {
            storeRef.current.setIsRunningAction(true);
            storeRef.current.setActionError(null);
            storeRef.current.setActionNotice(null);
            try {
                await task();
                storeRef.current.setActionNotice(successMessage);
                reloadWorkflow();
            } catch (error) {
                storeRef.current.setActionError(
                    resolveApiError(error, 'The workflow action failed.')
                );
            } finally {
                storeRef.current.setIsRunningAction(false);
            }
        },
        [reloadWorkflow]
    );

    const createDraft = useCallback(
        async (draftName?: string, sourceRevisionId?: number) => {
            if (!canEditInProject) return;
            await runWorkflowAction(async () => {
                await processAtlasApi.workflows.createRevision(workflow.id, {
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
                await processAtlasApi.revisions.publish(latestRevision.id, force);
            }, 'The current revision was published.');
        },
        [latestRevision, canPublishWorkflows, runWorkflowAction]
    );

    const deleteRevision = useCallback(
        async (revision: WorkflowRevisionSummary) => {
            await runWorkflowAction(
                async () => {
                    await processAtlasApi.revisions.delete(revision.id);
                },
                revision.draft_name ?? `rev. ${revision.revision_number} was deleted.`
            );
        },
        [runWorkflowAction]
    );

    const latestRevisionRef = useRef(latestRevision);
    latestRevisionRef.current = latestRevision;

    const previewRevisionRef = useRef(previewRevision);
    previewRevisionRef.current = previewRevision;

    // Sync canvas state when latestRevision changes (e.g. after switching drafts)
    useEffect(() => {
        const rev = latestRevisionRef.current;
        if (!rev) return;
        initializeGraph({
            nodes: rev.graph_json?.nodes,
            edges: rev.graph_json?.edges,
            screens: rev.screens ?? [],
            lockVersion: rev.lock_version ?? 0,
        });
        setScreens(rev.screens ?? []);
        storeRef.current.setActiveRevisionId(rev.id);
        storeRef.current.setEditingDraftName(rev.draft_name ?? '');
        storeRef.current.setPreviewRevision(null);
    }, [latestRevision?.id, initializeGraph, setScreens]);

    useEffect(() => {
        const rev = previewRevisionRef.current;
        if (!rev) return;
        initializeGraph({
            nodes: rev.graph_json?.nodes,
            edges: rev.graph_json?.edges,
            screens: rev.screens ?? [],
            lockVersion: rev.lock_version ?? 0,
        });
        setScreens(rev.screens ?? []);
    }, [previewRevision?.id, initializeGraph, setScreens]);

    useEffect(() => {
        storeRef.current.setEdgeDraftLabel(String(selectedEdge?.label ?? ''));
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
            storeRef.current.setActionNotice('Node deleted.');
        },
        [nodes, removeNode, clearSelection]
    );

    const handleRevisionTimelineClick = useCallback(
        async (revision: WorkflowRevisionSummary) => {
            storeRef.current.setActiveRevisionId(revision.id);
            if (latestRevision && revision.id === latestRevision.id) {
                initializeGraph({
                    nodes: latestRevision.graph_json?.nodes,
                    edges: latestRevision.graph_json?.edges,
                    screens: latestRevision.screens ?? [],
                    lockVersion: latestRevision.lock_version ?? 0,
                });
                setScreens(latestRevision.screens ?? []);
                storeRef.current.setPreviewRevision(null);
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
            storeRef.current.setPublishConfirmOpen(true);
        }
    }, [latestRevision, canPublishWorkflows, workflow.published_revision, publishCurrent]);

    const handleSaveDraftName = useCallback(
        async (name: string) => {
            if (!latestRevision || name === (latestRevision.draft_name ?? '')) return;
            try {
                await processAtlasApi.revisions.saveDraftName(latestRevision.id, name);
                router.reload({ only: ['workflow'] });
            } catch {
                storeRef.current.setEditingDraftName(latestRevision.draft_name ?? '');
            }
        },
        [latestRevision]
    );

    const saveSelectedEdgeLabel = useCallback(
        (event: React.FormEvent) => {
            event.preventDefault();
            if (!canEditWorkflows || !selectedEdge) return;
            updateEdgeLabel(selectedEdge.id, storeRef.current.edgeDraftLabel || undefined);
            storeRef.current.setActionNotice('Connection label updated.');
        },
        [canEditWorkflows, selectedEdge, updateEdgeLabel]
    );

    const removeSelectedEdge = useCallback(() => {
        if (!canEditWorkflows || !selectedEdge) return;
        removeEdge(selectedEdge.id);
        clearSelection();
        storeRef.current.setActionNotice('Connection deleted.');
    }, [canEditWorkflows, selectedEdge, removeEdge, clearSelection]);

    const saveGraph = useCallback(
        async (source: 'ui' | 'autosave' = 'ui') => {
            await baseSaveGraph(source);
            storeRef.current.setLastSavedAt(new Date().toISOString());
        },
        [baseSaveGraph]
    );

    useAutosave({
        saveFn: async () => {
            await saveGraph('autosave');
        },
        dependencies: [dirtyCounter],
        delay: 5000,
        minInterval: 15000,
        enabled: canEditWorkflows && graphState === 'dirty',
    });

    // Read reactive store values for return object
    const lastSavedAt = useEditorStore(state => state.lastSavedAt);
    const edgeDraftLabel = useEditorStore(state => state.edgeDraftLabel);
    const actionError = useEditorStore(state => state.actionError);
    const actionNotice = useEditorStore(state => state.actionNotice);
    const isRunningAction = useEditorStore(state => state.isRunningAction);
    const revisionsPanelOpen = useEditorStore(state => state.revisionsPanelOpen);
    const activeRevisionId = useEditorStore(state => state.activeRevisionId);
    const previewRevisionState = useEditorStore(state => state.previewRevision);
    const editingDraftName = useEditorStore(state => state.editingDraftName);
    const draftModalOpen = useEditorStore(state => state.draftModalOpen);
    const draftNameInput = useEditorStore(state => state.draftNameInput);
    const draftSourceRevisionId = useEditorStore(state => state.draftSourceRevisionId);
    const publishConfirmOpen = useEditorStore(state => state.publishConfirmOpen);
    const publishConfirmInput = useEditorStore(state => state.publishConfirmInput);
    const previewImageUrl = useEditorStore(state => state.previewImageUrl);

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
        setEdgeDraftLabel: storeRef.current.setEdgeDraftLabel,
        saveSelectedEdgeLabel,
        removeSelectedEdge,

        // Actions
        actionError,
        actionNotice,
        setActionError: storeRef.current.setActionError,
        setActionNotice: storeRef.current.setActionNotice,
        isRunningAction,
        runWorkflowAction,

        // Revisions
        revisionsPanelOpen,
        setRevisionsPanelOpen: storeRef.current.setRevisionsPanelOpen,
        activeRevisionId,
        activeRevision,
        previewRevision: previewRevisionState,
        handleRevisionTimelineClick,
        deleteRevision,
        createDraft,
        publishCurrent,
        handlePublishClick,
        editingDraftName,
        setEditingDraftName: storeRef.current.setEditingDraftName,
        handleSaveDraftName,

        // Modals
        draftModalOpen,
        setDraftModalOpen: storeRef.current.setDraftModalOpen,
        draftNameInput,
        setDraftNameInput: storeRef.current.setDraftNameInput,
        draftSourceRevisionId,
        setDraftSourceRevisionId: storeRef.current.setDraftSourceRevisionId,
        publishConfirmOpen,
        setPublishConfirmOpen: storeRef.current.setPublishConfirmOpen,
        publishConfirmInput,
        setPublishConfirmInput: storeRef.current.setPublishConfirmInput,

        // Image preview
        previewImageUrl,
        setPreviewImageUrl: storeRef.current.setPreviewImageUrl,

        // Reload
        reloadWorkflow,
    };
}
