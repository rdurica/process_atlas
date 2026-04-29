import StatusBadge from '@/Components/StatusBadge';
import { nodeDisplayLabel, workflowNodeKindLabel } from '../lib/utils';
import type { InspectorTab, WorkflowNodeData, WorkflowNodeKind } from '../types';
import type { Edge, Node } from '@xyflow/react';
import EdgeInspector from './inspector/EdgeInspector';
import NodeInspector from './inspector/NodeInspector';
import ScreenInspector from './inspector/ScreenInspector';
import type { ScreenEditorState } from './inspector/types';

interface InspectorPanelProps {
    selectedNode: Node | null;
    selectedEdge: Edge | null;
    selectedScreen: import('@/types/processAtlas').Screen | null;
    selectedNodeKind: WorkflowNodeKind;
    selectedNodeInspectorTabs: [InspectorTab, string][];
    selectedEdgeSourceNode: Node | null;
    canEditWorkflows: boolean;
    inspectorTab: InspectorTab;
    setInspectorTab: (tab: InspectorTab) => void;
    screenEditor: ScreenEditorState;
    updateNodeData: (nodeId: string, patch: Partial<WorkflowNodeData>) => void;
    removeWorkflowNode: (nodeId: string) => void;
    edgeDraftLabel: string;
    setEdgeDraftLabel: (label: string) => void;
    saveSelectedEdgeLabel: (event: React.FormEvent) => void;
    removeSelectedEdge: () => void;
    setPreviewImageUrl: (url: string | null) => void;
    projectWorkflows: { id: number; name: string; status: 'draft' | 'published' }[];
    workflowId: number;
    setActionNotice: (notice: string | null) => void;
}

export default function InspectorPanel({
    selectedNode,
    selectedEdge,
    selectedScreen,
    selectedNodeKind,
    selectedNodeInspectorTabs,
    selectedEdgeSourceNode,
    canEditWorkflows,
    inspectorTab,
    setInspectorTab,
    screenEditor,
    updateNodeData,
    removeWorkflowNode,
    edgeDraftLabel,
    setEdgeDraftLabel,
    saveSelectedEdgeLabel,
    removeSelectedEdge,
    setPreviewImageUrl,
    projectWorkflows,
    workflowId,
    setActionNotice,
}: InspectorPanelProps) {
    const handleNodeDataUpdate = (patch: Partial<WorkflowNodeData>) => {
        if (!selectedNode) {
            return;
        }

        updateNodeData(selectedNode.id, patch);
    };

    return (
        <aside className="workflow-inspector-panel">
            <section>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="eyebrow">Inspector</p>
                        <h2 className="panel-title mt-2">
                            {selectedEdge
                                ? 'Connection'
                                : selectedNode
                                  ? nodeDisplayLabel(selectedNode)
                                  : null}
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
                    <EdgeInspector
                        selectedEdge={selectedEdge}
                        selectedEdgeSourceNode={selectedEdgeSourceNode}
                        canEditWorkflows={canEditWorkflows}
                        edgeDraftLabel={edgeDraftLabel}
                        setEdgeDraftLabel={setEdgeDraftLabel}
                        saveSelectedEdgeLabel={saveSelectedEdgeLabel}
                        removeSelectedEdge={removeSelectedEdge}
                    />
                ) : selectedNode && selectedNodeKind !== 'screen' ? (
                    <NodeInspector
                        selectedNode={selectedNode}
                        selectedNodeKind={selectedNodeKind}
                        inspectorTab={inspectorTab}
                        canEditWorkflows={canEditWorkflows}
                        projectWorkflows={projectWorkflows}
                        workflowId={workflowId}
                        updateNodeData={handleNodeDataUpdate}
                        removeWorkflowNode={removeWorkflowNode}
                    />
                ) : selectedNode ? (
                    <ScreenInspector
                        selectedNode={selectedNode}
                        selectedScreen={selectedScreen}
                        inspectorTab={inspectorTab}
                        canEditWorkflows={canEditWorkflows}
                        screenEditor={screenEditor}
                        updateNodeData={handleNodeDataUpdate}
                        removeWorkflowNode={removeWorkflowNode}
                        setPreviewImageUrl={setPreviewImageUrl}
                        setActionNotice={setActionNotice}
                    />
                ) : null}
            </section>
        </aside>
    );
}
