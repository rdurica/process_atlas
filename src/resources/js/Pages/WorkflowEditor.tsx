import type { WorkflowData } from '@/types/processAtlas';
import { Head } from '@inertiajs/react';
import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useEffect, useRef } from 'react';
import FlowCanvas from '@/features/workflow-editor/components/FlowCanvas';
import { nodeTypes } from '@/features/workflow-editor/components/nodes';
import { useWorkflowEditor } from '@/features/workflow-editor/hooks/useWorkflowEditor';
import { useDirtyGraphUnload } from '@/features/workflow-editor/hooks/useDirtyGraphUnload';
import { useWorkflowKeyboard } from '@/features/workflow-editor/hooks/useWorkflowKeyboard';
import { isWorkflowNodeKind } from '@/features/workflow-editor/lib/utils';
import { useEditorStore } from '@/features/workflow-editor/stores/editorStore';
import '@xyflow/react/dist/style.css';
import ContextMenu from '@/features/workflow-editor/components/ContextMenu';
import InspectorPanel from '@/features/workflow-editor/components/InspectorPanel';
import RevisionPanel from '@/features/workflow-editor/components/RevisionPanel';
import ToastContainer from '@/features/workflow-editor/components/ToastContainer';
import PreviewImageModal from '@/features/workflow-editor/components/modals/PreviewImageModal';
import CreateDraftModal from '@/features/workflow-editor/components/modals/CreateDraftModal';
import PublishConfirmModal from '@/features/workflow-editor/components/modals/PublishConfirmModal';
import WorkflowTopBar from '@/features/workflow-editor/components/WorkflowTopBar';
import { ErrorBoundary } from '@/Components/ErrorBoundary';

type WorkflowEditorProps = {
    workflow: WorkflowData;
    projectWorkflows: { id: number; name: string; status: 'draft' | 'published' }[];
    currentUserRole: 'process_owner' | 'editor' | 'viewer' | null;
};

function Editor({ workflow, projectWorkflows, currentUserRole }: WorkflowEditorProps) {
    const editor = useWorkflowEditor({ workflow, projectWorkflows, currentUserRole });

    const { canEditWorkflows, saveGraph, isContextMenuOpen, closeContextMenu } = editor;

    const handleNodeClick = useCallback(
        (_: React.MouseEvent, node: { id: string; type?: string | undefined }) => {
            const store = useEditorStore.getState();
            store.selectNode(node.id, isWorkflowNodeKind(node.type) ? node.type : undefined);
        },
        []
    );

    const handleEdgeClick = useCallback((_: React.MouseEvent, edge: { id: string }) => {
        const store = useEditorStore.getState();
        store.selectEdge(edge.id);
    }, []);

    useWorkflowKeyboard({
        nodes: editor.nodes,
        edges: editor.edges,
        setNodes: editor.setNodes,
        setEdges: editor.setEdges,
        canEditWorkflows,
        saveGraph,
        copyNodes: editor.copyNodes,
        pasteNodes: editor.pasteNodes,
    });

    // Context menu click-outside
    const contextMenuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenuRef.current?.contains(event.target as Node)) {
                return;
            }
            if (isContextMenuOpen) {
                closeContextMenu();
            }
        };

        if (isContextMenuOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isContextMenuOpen, closeContextMenu]);

    useDirtyGraphUnload({
        graphState: editor.graphState,
        revisionId: editor.latestRevision?.id ?? null,
        nodes: editor.nodes,
        edges: editor.edges,
        lockVersion: editor.lockVersion,
    });

    return (
        <div className="workflow-fullscreen">
            <Head title={`${workflow.name} Editor`} />

            <div className="workflow-canvas-layer">
                {editor.isArchived && (
                    <div className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-4 border-b border-border bg-muted px-5 py-2.5">
                        <p className="text-sm font-medium text-muted-foreground">
                            This workflow is archived and read-only.
                        </p>
                    </div>
                )}

                <FlowCanvas
                    nodes={editor.nodes}
                    edges={editor.edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={editor.handleNodesChange}
                    onEdgesChange={editor.onEdgesChange}
                    onConnect={editor.onConnect}
                    onNodeClick={handleNodeClick}
                    onNodeDoubleClick={handleNodeClick}
                    onEdgeClick={handleEdgeClick}
                    onEdgeDoubleClick={handleEdgeClick}
                    onPaneClick={editor.clearSelection}
                    onPaneContextMenu={editor.handlePaneContextMenu}
                    onDropNode={editor.handleDropNode}
                    editable={editor.canEditWorkflows}
                />
            </div>

            <WorkflowTopBar
                workflow={workflow}
                latestRevision={editor.latestRevision ?? null}
                canUndo={editor.canUndo}
                canRedo={editor.canRedo}
                undo={editor.undo}
                redo={editor.redo}
                saveGraph={editor.saveGraph}
                reloadWorkflow={editor.reloadWorkflow}
                handleRevisionTimelineClick={editor.handleRevisionTimelineClick}
            />

            <InspectorPanel
                isVisible={!!(editor.selectedEdge || editor.selectedNode)}
                selectedNode={editor.selectedNode}
                selectedEdge={editor.selectedEdge}
                selectedScreen={editor.selectedScreen}
                selectedNodeKind={editor.selectedNodeKind}
                selectedNodeInspectorTabs={editor.selectedNodeInspectorTabs}
                selectedEdgeSourceNode={editor.selectedEdgeSourceNode}
                screenEditor={editor.screenEditor}
                updateNodeData={editor.updateNodeData}
                removeWorkflowNode={editor.removeWorkflowNode}
                saveSelectedEdgeLabel={editor.saveSelectedEdgeLabel}
                removeSelectedEdge={editor.removeSelectedEdge}
                projectWorkflows={projectWorkflows}
                workflowId={workflow.id}
            />

            <RevisionPanel
                revisions={workflow.revisions}
                latestRevision={editor.latestRevision}
                activeRevision={editor.activeRevision ?? null}
                isArchived={editor.isArchived}
                handleSaveDraftName={editor.handleSaveDraftName}
                handlePublishClick={editor.handlePublishClick}
                handleRevisionTimelineClick={editor.handleRevisionTimelineClick}
                deleteRevision={editor.deleteRevision}
            />

            <ToastContainer />

            <PreviewImageModal />

            <CreateDraftModal createDraft={editor.createDraft} />

            <PublishConfirmModal publishCurrent={editor.publishCurrent} />

            {editor.isContextMenuOpen && (
                <div ref={contextMenuRef}>
                    <ContextMenu
                        position={editor.contextMenuPosition}
                        onAddElement={editor.handleAddElementFromContextMenu}
                        onClose={editor.closeContextMenu}
                    />
                </div>
            )}
        </div>
    );
}

export default function WorkflowEditor(props: WorkflowEditorProps) {
    return (
        <ReactFlowProvider>
            <ErrorBoundary>
                <Editor {...props} />
            </ErrorBoundary>
        </ReactFlowProvider>
    );
}
