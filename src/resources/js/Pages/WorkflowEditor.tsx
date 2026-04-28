import type { WorkflowData } from '@/types/processAtlas';
import { Head } from '@inertiajs/react';
import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useEffect, useRef } from 'react';
import FlowCanvas from '@/features/workflow-editor/components/FlowCanvas';
import { nodeTypes } from '@/features/workflow-editor/components/nodes';
import { useWorkflowEditor } from '@/features/workflow-editor/hooks/useWorkflowEditor';
import { useDirtyGraphUnload } from '@/features/workflow-editor/hooks/useDirtyGraphUnload';
import { useWorkflowKeyboardShortcuts } from '@/features/workflow-editor/hooks/useWorkflowKeyboardShortcuts';
import { isWorkflowNodeKind } from '@/features/workflow-editor/lib/utils';
import '@xyflow/react/dist/style.css';
import ContextMenu from '../features/workflow-editor/components/ContextMenu';
import InspectorPanel from '@/features/workflow-editor/components/InspectorPanel';
import RevisionPanel from '@/features/workflow-editor/components/RevisionPanel';
import ToastContainer from '@/features/workflow-editor/components/ToastContainer';
import PreviewImageModal from '@/features/workflow-editor/components/modals/PreviewImageModal';
import CreateDraftModal from '@/features/workflow-editor/components/modals/CreateDraftModal';
import PublishConfirmModal from '@/features/workflow-editor/components/modals/PublishConfirmModal';
import WorkflowTopBar from '@/features/workflow-editor/components/WorkflowTopBar';

type WorkflowEditorProps = {
    workflow: WorkflowData;
    projectWorkflows: { id: number; name: string; status: 'draft' | 'published' }[];
    currentUserRole: 'process_owner' | 'editor' | 'viewer' | null;
};

function Editor({ workflow, projectWorkflows, currentUserRole }: WorkflowEditorProps) {
    const editor = useWorkflowEditor({ workflow, projectWorkflows, currentUserRole });

    const {
        canEditWorkflows,
        selectedNodes,
        copiedNodes,
        copyNodes,
        pasteNodes,
        deleteNodes,
        graphState,
        saveGraph,
        undo,
        redo,
        clearSelection,
        isContextMenuOpen,
        closeContextMenu,
    } = editor;

    const selectNodeRef = useRef(editor.selectNode);
    selectNodeRef.current = editor.selectNode;

    const selectEdgeRef = useRef(editor.selectEdge);
    selectEdgeRef.current = editor.selectEdge;

    const handleNodeClick = useCallback(
        (_: React.MouseEvent, node: { id: string; type?: string | undefined }) => {
            selectNodeRef.current(node.id, isWorkflowNodeKind(node.type) ? node.type : undefined);
        },
        []
    );

    const handleEdgeClick = useCallback((_: React.MouseEvent, edge: { id: string }) => {
        selectEdgeRef.current(edge.id);
    }, []);

    useWorkflowKeyboardShortcuts({
        enabled: canEditWorkflows,
        graphState,
        selectedNodes,
        copiedNodes,
        copyNodes,
        pasteNodes,
        deleteNodes,
        undo,
        redo,
        saveGraph,
        clearSelection,
    });

    // Context menu click-outside
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
                {editor.previewRevision && editor.previewRevision.is_published && (
                    <div className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-5 py-2.5">
                        <p className="text-sm font-medium text-amber-900">
                            Viewing rev. {editor.previewRevision.revision_number} (read-only)
                        </p>
                        {editor.latestRevision && (
                            <button
                                type="button"
                                onClick={() =>
                                    editor.handleRevisionTimelineClick(editor.latestRevision!)
                                }
                                className="text-sm font-semibold text-amber-700 hover:text-amber-900"
                            >
                                Return to current draft
                            </button>
                        )}
                    </div>
                )}

                {editor.isArchived && (
                    <div className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-4 border-b border-slate-200 bg-slate-100 px-5 py-2.5">
                        <p className="text-sm font-medium text-slate-700">
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
                graphState={editor.graphState}
                canEditWorkflows={editor.canEditWorkflows}
                canUndo={editor.canUndo}
                canRedo={editor.canRedo}
                undo={editor.undo}
                redo={editor.redo}
                saveGraph={editor.saveGraph}
                isArchived={editor.isArchived}
                setRevisionsPanelOpen={editor.setRevisionsPanelOpen}
                reloadWorkflow={editor.reloadWorkflow}
            />

            {(editor.selectedEdge || editor.selectedNode) && (
                <InspectorPanel
                    selectedNode={editor.selectedNode}
                    selectedEdge={editor.selectedEdge}
                    selectedScreen={editor.selectedScreen}
                    selectedNodeKind={editor.selectedNodeKind}
                    selectedNodeInspectorTabs={editor.selectedNodeInspectorTabs}
                    selectedEdgeSourceNode={editor.selectedEdgeSourceNode}
                    canEditWorkflows={editor.canEditWorkflows}
                    inspectorTab={editor.inspectorTab}
                    setInspectorTab={editor.setInspectorTab}
                    screenEditor={editor.screenEditor}
                    updateNodeData={editor.updateNodeData}
                    removeWorkflowNode={editor.removeWorkflowNode}
                    edgeDraftLabel={editor.edgeDraftLabel}
                    setEdgeDraftLabel={editor.setEdgeDraftLabel}
                    saveSelectedEdgeLabel={editor.saveSelectedEdgeLabel}
                    removeSelectedEdge={editor.removeSelectedEdge}
                    setPreviewImageUrl={editor.setPreviewImageUrl}
                    projectWorkflows={projectWorkflows}
                    workflowId={workflow.id}
                    setActionNotice={editor.setActionNotice}
                />
            )}

            <RevisionPanel
                revisions={workflow.revisions}
                latestRevision={editor.latestRevision}
                activeRevision={editor.activeRevision ?? null}
                canEditInProject={editor.canEditInProject}
                canPublishWorkflows={editor.canPublishWorkflows}
                isArchived={editor.isArchived}
                isRunningAction={editor.isRunningAction}
                editingDraftName={editor.editingDraftName}
                setEditingDraftName={editor.setEditingDraftName}
                handleSaveDraftName={editor.handleSaveDraftName}
                handlePublishClick={editor.handlePublishClick}
                handleRevisionTimelineClick={editor.handleRevisionTimelineClick}
                deleteRevision={editor.deleteRevision}
                lastSavedAt={editor.lastSavedAt}
                revisionsPanelOpen={editor.revisionsPanelOpen}
                setRevisionsPanelOpen={editor.setRevisionsPanelOpen}
                setDraftSourceRevisionId={editor.setDraftSourceRevisionId}
                setDraftModalOpen={editor.setDraftModalOpen}
            />

            <ToastContainer actionError={editor.actionError} actionNotice={editor.actionNotice} />

            <PreviewImageModal
                previewImageUrl={editor.previewImageUrl}
                onClose={() => editor.setPreviewImageUrl(null)}
            />

            <CreateDraftModal
                open={editor.draftModalOpen}
                onClose={() => {
                    editor.setDraftModalOpen(false);
                    editor.setDraftNameInput('');
                    editor.setDraftSourceRevisionId(undefined);
                }}
                draftNameInput={editor.draftNameInput}
                setDraftNameInput={editor.setDraftNameInput}
                draftSourceRevisionId={editor.draftSourceRevisionId}
                createDraft={editor.createDraft}
                isRunningAction={editor.isRunningAction}
            />

            <PublishConfirmModal
                open={editor.publishConfirmOpen}
                onClose={() => {
                    editor.setPublishConfirmOpen(false);
                    editor.setPublishConfirmInput('');
                }}
                publishConfirmInput={editor.publishConfirmInput}
                setPublishConfirmInput={editor.setPublishConfirmInput}
                publishCurrent={editor.publishCurrent}
                isRunningAction={editor.isRunningAction}
            />

            {editor.isContextMenuOpen && (
                <ContextMenu
                    position={editor.contextMenuPosition}
                    onAddElement={editor.handleAddElementFromContextMenu}
                    onClose={editor.closeContextMenu}
                />
            )}
        </div>
    );
}

export default function WorkflowEditor(props: WorkflowEditorProps) {
    return (
        <ReactFlowProvider>
            <Editor {...props} />
        </ReactFlowProvider>
    );
}
