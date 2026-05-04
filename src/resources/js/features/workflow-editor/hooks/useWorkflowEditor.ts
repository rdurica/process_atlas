import { useCallback, useEffect, useMemo, useRef } from 'react';
import { router } from '@inertiajs/react';
import { MarkerType, useReactFlow } from '@xyflow/react';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { processAtlasApi } from '@/shared/api/processAtlasApi';
import type { WorkflowData, WorkflowRevisionSummary } from '@/types/processAtlas';
import { buildInitialNodes, inspectorTabsForNodeKind, isWorkflowNodeKind } from '../lib/utils';
import { useEditorStore } from '../stores/editorStore';
import { useEditorPermissions } from './useEditorPermissions';
import { useEditorSelection } from './useEditorSelection';
import { useEditorClipboard } from './useEditorClipboard';
import { useEditorPersistence } from './useEditorPersistence';
import { useRevisionActions } from './useRevisionActions';
import { useScreenEditor } from './useScreenEditor';
import { useWorkflowGraph } from './useWorkflowGraph';
import type { WorkflowNodeKind } from '../types';

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
    const previewRevision = useEditorStore(state => state.previewRevision);
    const visibleRevision = previewRevision ?? latestRevision;

    const { canEditInProject, canPublishWorkflows, canEditWorkflows } = useEditorPermissions({
        currentUserRole,
        latestRevisionIsPublished: latestRevision?.is_published,
        latestRevisionIsLocked: latestRevision?.is_locked,
        isArchived,
        previewRevision,
    });

    // Sync permissions to editor store
    useEffect(() => {
        useEditorStore.getState().initPermissions(currentUserRole, latestRevision, isArchived);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        currentUserRole,
        isArchived,
        latestRevision?.id,
        latestRevision?.is_published,
        latestRevision?.is_locked,
        previewRevision?.id,
    ]);

    // Graph operations
    const graph = useWorkflowGraph({
        initialNodes: buildInitialNodes(
            visibleRevision?.graph_json?.nodes,
            visibleRevision?.screens ?? []
        ),
        initialEdges: (visibleRevision?.graph_json?.edges ?? []).map(edge => ({
            ...edge,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#0f5ef7', width: 10, height: 10 },
        })),
        lockVersion: visibleRevision?.lock_version ?? 0,
        latestRevisionId: latestRevision?.id ?? null,
        canEdit: canEditWorkflows,
    });

    const { screenToFlowPosition } = useReactFlow();

    // Selection
    const selection = useEditorSelection();

    // Clear selection when entering preview mode
    useEffect(() => {
        if (previewRevision !== null) {
            selection.clearSelection();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewRevision]);

    // Screens from store
    const screens = useEditorStore(state => state.screens);
    const setScreens = useEditorStore(state => state.setScreens);

    const visibleRevisionGraphKey = useMemo(
        () =>
            JSON.stringify({
                id: visibleRevision?.id ?? null,
                lockVersion: visibleRevision?.lock_version ?? 0,
                nodes: visibleRevision?.graph_json?.nodes ?? [],
                edges: visibleRevision?.graph_json?.edges ?? [],
                screens: (visibleRevision?.screens ?? []).map(screen => ({
                    id: screen.id,
                    node_id: screen.node_id,
                    title: screen.title,
                    subtitle: screen.subtitle,
                    note: screen.note,
                    image_url: screen.image_url,
                    drawing_json: screen.drawing_json,
                    drawing_image_url: screen.drawing_image_url,
                    custom_fields: screen.custom_fields,
                })),
            }),
        [visibleRevision]
    );

    const selectedNode = useMemo(
        () => graph.nodes.find(node => node.id === selection.selectedNodeId) ?? null,
        [graph.nodes, selection.selectedNodeId]
    );

    const selectedEdge = useMemo(
        () => graph.edges.find(edge => edge.id === selection.selectedEdgeId) ?? null,
        [graph.edges, selection.selectedEdgeId]
    );

    const selectedEdgeSourceNode = useMemo(
        () => graph.nodes.find(node => node.id === selectedEdge?.source) ?? null,
        [graph.nodes, selectedEdge?.source]
    );

    const selectedNodes = useMemo(() => graph.nodes.filter(node => node.selected), [graph.nodes]);

    const selectedNodeKind = useMemo(() => {
        if (!selectedNode) return 'screen' as const;
        return isWorkflowNodeKind(selectedNode.type) ? selectedNode.type : 'screen';
    }, [selectedNode]);

    const selectedNodeInspectorTabs = useMemo(
        () => (selectedNodeKind ? inspectorTabsForNodeKind(selectedNodeKind) : []),
        [selectedNodeKind]
    );

    // Clipboard
    const clipboard = useEditorClipboard({ setNodes: graph.setNodes });

    // History
    const history = useCanvasHistory(graph.nodes, graph.edges, graph.setNodes, graph.setEdges);

    // Sync graph and screens when Inertia replaces the active or preview revision.
    useEffect(() => {
        const nextNodes = buildInitialNodes(
            visibleRevision?.graph_json?.nodes,
            visibleRevision?.screens ?? []
        );
        const nextEdges = (visibleRevision?.graph_json?.edges ?? []).map(edge => ({
            ...edge,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#0f5ef7', width: 10, height: 10 },
        }));

        graph.initializeGraph({
            nodes: visibleRevision?.graph_json?.nodes ?? [],
            edges: visibleRevision?.graph_json?.edges ?? [],
            screens: visibleRevision?.screens ?? [],
            lockVersion: visibleRevision?.lock_version ?? 0,
        });
        history.reset(nextNodes, nextEdges);
        setScreens(visibleRevision?.screens ?? []);
        selection.clearSelection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleRevisionGraphKey, graph.initializeGraph, history.reset, setScreens]);

    // Sync screen image/drawing state from Zustand store into React Flow node data
    // so that ScreenNode renders the latest visual without a hard refresh.
    useEffect(() => {
        for (const screen of screens) {
            const node = graph.nodes.find(n => n.id === screen.node_id);
            if (!node) continue;

            const patch: Record<string, unknown> = {};
            if (node.data.image_url !== screen.image_url) patch.image_url = screen.image_url;
            if (node.data.drawing_image_url !== screen.drawing_image_url) {
                patch.drawing_image_url = screen.drawing_image_url;
            }
            if (node.data.drawing_json !== screen.drawing_json) {
                patch.drawing_json = screen.drawing_json;
            }

            if (Object.keys(patch).length > 0) {
                graph.updateNodeData(screen.node_id, patch);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screens]);

    // Persistence (save graph)
    const persistence = useEditorPersistence({
        latestRevisionId: latestRevision?.id ?? null,
        canEdit: canEditWorkflows,
        nodes: graph.nodes,
        edges: graph.edges,
        lockVersion: graph.lockVersion,
        dirtyCounter: graph.dirtyCounter,
        onLockVersionChange: graph.setLockVersion,
    });

    // Revisions
    const revisions = useRevisionActions();

    // Screen editor
    const screenEditor = useScreenEditor();

    // Keyboard shortcuts
    const { undo, redo, canUndo, canRedo } = history;

    // Context menu
    const contextMenuFlowPosition = useRef({ x: 0, y: 0 });

    const handlePaneContextMenu = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            if (!canEditWorkflows) return;
            const flowPosition = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            contextMenuFlowPosition.current = flowPosition;
            clipboard.openContextMenu(event.clientX, event.clientY);
        },
        [canEditWorkflows, clipboard, screenToFlowPosition]
    );

    const handleAddElementFromContextMenu = useCallback(
        (kind: WorkflowNodeKind) => {
            if (kind === 'screen') {
                const nextId = graph.addScreenNode(contextMenuFlowPosition.current);
                if (nextId) selection.selectNode(nextId, 'screen');
            } else if (kind !== 'if') {
                const nextId = graph.addNode(
                    kind as Exclude<WorkflowNodeKind, 'screen' | 'if'>,
                    contextMenuFlowPosition.current
                );
                selection.selectNode(nextId, kind);
            }
            clipboard.closeContextMenu();
        },
        [graph, selection, clipboard]
    );

    const handleDropNode = useCallback(
        (kind: WorkflowNodeKind, position: { x: number; y: number }) => {
            if (kind === 'start') return;
            if (kind === 'screen') {
                const nextId = graph.addScreenNode(position);
                if (nextId) selection.selectNode(nextId, 'screen');
            } else if (kind !== 'if') {
                const nextId = graph.addNode(
                    kind as Exclude<WorkflowNodeKind, 'screen' | 'if'>,
                    position
                );
                selection.selectNode(nextId, kind);
            }
        },
        [graph, selection]
    );

    const removeWorkflowNode = useCallback(
        (nodeId: string) => {
            if (!canEditWorkflows) return;
            const node = graph.nodes.find(n => n.id === nodeId);
            if (node?.type === 'start') return;
            graph.removeNode(nodeId);
            selection.clearSelection();
        },
        [canEditWorkflows, graph, selection]
    );

    const handleNodesChange = useCallback(
        (changes: Parameters<typeof graph.onNodesChange>[0]) => {
            // Sync React Flow selection changes → Zustand store
            const selectChanges = changes.filter(c => c.type === 'select');
            if (selectChanges.length > 0) {
                const selectChange = selectChanges.find(c => c.selected);
                if (selectChange) {
                    const node = graph.nodes.find(n => n.id === selectChange.id);
                    selection.selectNode(
                        selectChange.id,
                        isWorkflowNodeKind(node?.type) ? node.type : undefined
                    );
                } else {
                    selection.clearSelection();
                }
            }

            if (!canEditWorkflows) return;
            const allowedChanges = changes.filter(change => {
                if (change.type === 'remove') {
                    const node = graph.nodes.find(n => n.id === change.id);
                    return node?.type !== 'start';
                }
                return true;
            });
            graph.onNodesChange(allowedChanges);
        },
        [canEditWorkflows, graph, selection]
    );

    const handleEdgesChange = useCallback(
        (changes: Parameters<typeof graph.onEdgesChange>[0]) => {
            // Sync React Flow edge selection changes → Zustand store
            const selectChanges = changes.filter(c => c.type === 'select');
            if (selectChanges.length > 0) {
                const selectChange = selectChanges.find(c => c.selected);
                if (selectChange) {
                    selection.selectEdge(selectChange.id);
                } else {
                    selection.clearSelection();
                }
            }

            graph.onEdgesChange(changes);
        },
        [graph, selection]
    );

    const reloadWorkflow = useCallback(() => {
        router.reload({ only: ['workflow'] });
    }, []);

    const handleRevisionTimelineClick = useCallback(
        async (revision: WorkflowRevisionSummary) => {
            if (latestRevision && revision.id === latestRevision.id) {
                useEditorStore.getState().setPreviewRevision(null);
                router.reload({ only: ['workflow'] });
                return;
            }

            if (!revision.is_published) {
                useEditorStore.getState().setPreviewRevision(null);
                await revisions.switchToDraft(revision.id);
                return;
            }

            // Preview published revision - fetch and set
            try {
                const response = await processAtlasApi.revisions.get(revision.id);
                useEditorStore.getState().setPreviewRevision(response.data.data);
            } catch {
                // silently ignore
            }
        },
        [latestRevision, revisions]
    );

    const handlePublishClick = useCallback(() => {
        if (!latestRevision || !canPublishWorkflows) return;
        const publishedRevisionId = workflow.published_revision?.id ?? null;
        const isFromLatestPublished =
            publishedRevisionId === null ||
            latestRevision.source_revision_id === publishedRevisionId;
        if (isFromLatestPublished) {
            void revisions.publishCurrent(latestRevision.id);
        } else {
            useEditorStore.getState().setPublishConfirmOpen(true);
        }
    }, [latestRevision, canPublishWorkflows, workflow.published_revision, revisions]);

    // Edge editing
    const saveSelectedEdgeLabel = useCallback(
        (event: React.FormEvent) => {
            event.preventDefault();
            if (!canEditWorkflows || !selectedEdge) return;
            const store = useEditorStore.getState();
            graph.updateEdgeLabel(selectedEdge.id, store.edgeDraftLabel || undefined);
        },
        [canEditWorkflows, selectedEdge, graph]
    );

    const removeSelectedEdge = useCallback(() => {
        if (!canEditWorkflows || !selectedEdge) return;
        graph.removeEdge(selectedEdge.id);
        selection.clearSelection();
    }, [canEditWorkflows, selectedEdge, graph, selection]);

    const graphState = useEditorStore(state => state.graphState);
    const graphMessage = useEditorStore(state => state.graphMessage);
    const lastSavedAt = useEditorStore(state => state.lastSavedAt);
    const edgeDraftLabel = useEditorStore(state => state.edgeDraftLabel);
    const setEdgeDraftLabel = useEditorStore(state => state.setEdgeDraftLabel);
    const actionError = useEditorStore(state => state.actionError);
    const actionNotice = useEditorStore(state => state.actionNotice);
    const setActionError = useEditorStore(state => state.setActionError);
    const setActionNotice = useEditorStore(state => state.setActionNotice);
    const isRunningAction = useEditorStore(state => state.isRunningAction);
    const activeRevisionId = useEditorStore(state => state.activeRevisionId);
    const editingDraftName = useEditorStore(state => state.editingDraftName);
    const setEditingDraftName = useEditorStore(state => state.setEditingDraftName);
    const draftModalOpen = useEditorStore(state => state.draftModalOpen);
    const setDraftModalOpen = useEditorStore(state => state.setDraftModalOpen);
    const draftNameInput = useEditorStore(state => state.draftNameInput);
    const setDraftNameInput = useEditorStore(state => state.setDraftNameInput);
    const draftSourceRevisionId = useEditorStore(state => state.draftSourceRevisionId);
    const setDraftSourceRevisionId = useEditorStore(state => state.setDraftSourceRevisionId);
    const publishConfirmOpen = useEditorStore(state => state.publishConfirmOpen);
    const setPublishConfirmOpen = useEditorStore(state => state.setPublishConfirmOpen);
    const publishConfirmInput = useEditorStore(state => state.publishConfirmInput);
    const setPublishConfirmInput = useEditorStore(state => state.setPublishConfirmInput);
    const previewImageUrl = useEditorStore(state => state.previewImageUrl);
    const setPreviewImageUrl = useEditorStore(state => state.setPreviewImageUrl);
    const activeRevision = useMemo(
        () =>
            workflow.revisions.find(r => r.id === (previewRevision?.id ?? activeRevisionId)) ??
            null,
        [workflow.revisions, previewRevision?.id, activeRevisionId]
    );

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
        nodes: graph.nodes,
        edges: graph.edges,
        setNodes: graph.setNodes,
        setEdges: graph.setEdges,
        handleNodesChange,
        onEdgesChange: handleEdgesChange,
        onConnect: graph.onConnect,
        graphState,
        graphMessage,
        lockVersion: graph.lockVersion,
        saveGraph: persistence.saveGraph,
        markGraphSaved: persistence.markGraphSaved,
        lastSavedAt,

        // History
        undo,
        redo,
        canUndo,
        canRedo,

        // Selection
        selectedNodeId: selection.selectedNodeId,
        selectedEdgeId: selection.selectedEdgeId,
        selectedNode,
        selectedEdge,
        selectedScreen: selection.selectedScreen,
        selectedNodeKind,
        selectedNodeInspectorTabs,
        selectedEdgeSourceNode,
        inspectorTab: selection.inspectorTab,
        selectNode: selection.selectNode,
        selectEdge: selection.selectEdge,
        clearSelection: selection.clearSelection,
        setInspectorTab: selection.setInspectorTab,

        // Screens
        screens,
        setScreens,
        screenEditor,

        // Copy/paste
        copiedNodes: clipboard.copiedNodes,
        copyNodes: clipboard.copyNodes,
        pasteNodes: clipboard.pasteNodes,
        deleteNodes: clipboard.deleteNodes,
        selectedNodes,
        isContextMenuOpen: clipboard.isContextMenuOpen,
        contextMenuPosition: clipboard.contextMenuPosition,
        openContextMenu: clipboard.openContextMenu,
        closeContextMenu: clipboard.closeContextMenu,
        contextMenuFlowPosition,
        handlePaneContextMenu,
        handleAddElementFromContextMenu,
        handleDropNode,
        removeWorkflowNode,

        // Node data updates
        updateNodeData: graph.updateNodeData,
        updateEdgeLabel: graph.updateEdgeLabel,
        removeEdge: graph.removeEdge,

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

        // Revisions
        activeRevision,
        previewRevision,
        handleRevisionTimelineClick,
        deleteRevision: revisions.deleteRevision,
        createDraft: useCallback(
            (draftName?: string, sourceRevisionId?: number) =>
                revisions.createDraft(workflow.id, draftName, sourceRevisionId),
            [revisions, workflow.id]
        ),
        publishCurrent: useCallback(
            (force = false) => {
                if (!latestRevision) return Promise.resolve();
                return revisions.publishCurrent(latestRevision.id, force);
            },
            [revisions, latestRevision]
        ),
        handlePublishClick,
        editingDraftName,
        setEditingDraftName,
        handleSaveDraftName: useCallback(
            (name: string) => {
                if (!latestRevision) return Promise.resolve();
                return revisions.saveDraftName(latestRevision.id, name);
            },
            [revisions, latestRevision]
        ),

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
