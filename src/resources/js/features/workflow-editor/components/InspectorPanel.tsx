import { memo, useCallback, useState } from 'react';
import { workflowNodeKindLabel } from '../lib/utils';
import type { InspectorTab, WorkflowNodeData, WorkflowNodeKind } from '../types';
import type { Edge, Node } from '@xyflow/react';
import type { Screen } from '@/types/processAtlas';
import { useEditorStore } from '../stores/editorStore';
import EdgeInspector from './inspector/EdgeInspector';
import NodeInspector from './inspector/NodeInspector';
import ScreenInspector from './inspector/ScreenInspector';
import type { ScreenEditorState } from './inspector/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface InspectorPanelProps {
    isVisible: boolean;
    selectedNode: Node | null;
    selectedEdge: Edge | null;
    selectedScreen: Screen | null;
    selectedNodeKind: WorkflowNodeKind;
    selectedNodeInspectorTabs: [InspectorTab, string][];
    selectedEdgeSourceNode: Node | null;
    screenEditor: ScreenEditorState;
    updateNodeData: (nodeId: string, patch: Partial<WorkflowNodeData>) => void;
    removeWorkflowNode: (nodeId: string) => void;
    saveSelectedEdgeLabel: (event: React.FormEvent) => void;
    removeSelectedEdge: () => void;
    projectWorkflows: { id: string; name: string; status: 'draft' | 'published' }[];
    workflowId: string;
}

function InspectorPanel({
    isVisible,
    selectedNode,
    selectedEdge,
    selectedScreen,
    selectedNodeKind,
    selectedNodeInspectorTabs,
    selectedEdgeSourceNode,
    screenEditor,
    updateNodeData,
    removeWorkflowNode,
    saveSelectedEdgeLabel,
    removeSelectedEdge,
    projectWorkflows,
    workflowId,
}: InspectorPanelProps) {
    const canEditWorkflows = useEditorStore(state => state.canEditWorkflows);
    const inspectorTab = useEditorStore(state => state.inspectorTab);
    const setInspectorTab = useEditorStore(state => state.setInspectorTab);
    const edgeDraftLabel = useEditorStore(state => state.edgeDraftLabel);
    const setEdgeDraftLabel = useEditorStore(state => state.setEdgeDraftLabel);
    const setPreviewImageUrl = useEditorStore(state => state.setPreviewImageUrl);
    const setActionNotice = useEditorStore(state => state.setActionNotice);
    const handleNodeDataUpdate = useCallback(
        (patch: Partial<WorkflowNodeData>) => {
            if (!selectedNode) {
                return;
            }

            updateNodeData(selectedNode.id, patch);
        },
        [selectedNode, updateNodeData]
    );
    const [nodeIdCopied, setNodeIdCopied] = useState(false);
    const [edgeIdCopied, setEdgeIdCopied] = useState(false);

    const handleCopy = useCallback((text: string, setCopied: (value: boolean) => void) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    if (!isVisible) {
        return (
            <aside className="workflow-inspector-panel hidden">
                <div className="glass-strong flex h-full flex-col" />
            </aside>
        );
    }

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
                    {selectedNode && (
                        <div className="mb-3 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                            <span className="text-xs font-medium text-muted-foreground">ID:</span>
                            <code className="flex-1 break-all font-mono text-xs text-foreground">
                                {selectedNode.id}
                            </code>
                            <button
                                type="button"
                                className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
                                    nodeIdCopied
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                                onClick={() => handleCopy(selectedNode.id, setNodeIdCopied)}
                                title="Copy node ID"
                            >
                                {nodeIdCopied ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </button>
                        </div>
                    )}

                    {selectedEdge && (
                        <div className="mb-3 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                            <span className="text-xs font-medium text-muted-foreground">ID:</span>
                            <code className="flex-1 break-all font-mono text-xs text-foreground">
                                {selectedEdge.id}
                            </code>
                            <button
                                type="button"
                                className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
                                    edgeIdCopied
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                                onClick={() => handleCopy(selectedEdge.id, setEdgeIdCopied)}
                                title="Copy edge ID"
                            >
                                {edgeIdCopied ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </button>
                        </div>
                    )}

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

export default memo(InspectorPanel);
