import { workflowNodeKindLabel } from '../lib/utils';
import type { InspectorTab, WorkflowNodeData, WorkflowNodeKind } from '../types';
import type { Edge, Node } from '@xyflow/react';
import EdgeInspector from './inspector/EdgeInspector';
import NodeInspector from './inspector/NodeInspector';
import ScreenInspector from './inspector/ScreenInspector';
import type { ScreenEditorState } from './inspector/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';

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
            <Card className="glass-strong flex h-full flex-col">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Inspector
                            </p>
                            <CardTitle className="mt-1 text-base">
                                {selectedEdge
                                    ? 'Connection'
                                    : selectedNode
                                      ? workflowNodeKindLabel(selectedNodeKind)
                                      : null}
                            </CardTitle>
                        </div>
                        {selectedEdge ? (
                            <Badge variant="subtle">Edge</Badge>
                        ) : selectedScreen ? (
                            <Badge variant="subtle">Saved Screen</Badge>
                        ) : selectedNode ? (
                            <Badge variant="secondary">
                                {workflowNodeKindLabel(selectedNodeKind)}
                            </Badge>
                        ) : null}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    {selectedNode && selectedNodeInspectorTabs.length > 0 && (
                        <Tabs
                            value={inspectorTab}
                            onValueChange={value => setInspectorTab(value as InspectorTab)}
                            className="mb-4"
                        >
                            <TabsList
                                className="w-full"
                                style={{
                                    gridTemplateColumns: `repeat(${selectedNodeInspectorTabs.length}, minmax(0, 1fr))`,
                                }}
                            >
                                {selectedNodeInspectorTabs.map(([key, label]) => (
                                    <TabsTrigger key={key} value={key}>
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
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
                </CardContent>
            </Card>
        </aside>
    );
}
