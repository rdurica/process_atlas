import { useCallback, useState } from 'react';
import type { WorkflowNodeKind, InspectorTab } from '../types';

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

function defaultInspectorTab(nodeKind: WorkflowNodeKind): InspectorTab {
    if (nodeKind === 'screen') return 'screen';
    if (nodeKind === 'action' || nodeKind === 'start') return 'general';
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

function workflowNodeKindLabel(value: WorkflowNodeKind): string {
    if (value === 'if') return 'condition';
    return value;
}

interface UseNodeSelectionOptions {
    initialNodeId: string | null;
    initialEdgeId: string | null;
    nodes: { id: string; type: string | undefined }[];
}

interface UseNodeSelectionReturn {
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    selectedNodeKind: WorkflowNodeKind;
    selectedNodeInspectorTabs: [InspectorTab, string][];
    inspectorTab: InspectorTab;
    setSelectedNodeId: (nodeId: string | null) => void;
    setSelectedEdgeId: (edgeId: string | null) => void;
    setInspectorTab: (tab: InspectorTab) => void;
    selectNode: (nodeId: string, nodeKind?: WorkflowNodeKind) => void;
    selectEdge: (edgeId: string) => void;
    clearSelection: () => void;
}

export function useNodeSelection({
    initialNodeId,
    initialEdgeId,
    nodes,
}: UseNodeSelectionOptions): UseNodeSelectionReturn {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialNodeId);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(initialEdgeId);
    const [inspectorTab, setInspectorTab] = useState<InspectorTab>('screen');

    const selectedNode = nodes.find(node => node.id === selectedNodeId) ?? null;

    const selectedNodeKind = selectedNode
        ? isWorkflowNodeKind(selectedNode.type)
            ? selectedNode.type
            : 'screen'
        : 'screen';

    const selectedNodeInspectorTabs = selectedNode
        ? inspectorTabsForNodeKind(selectedNodeKind)
        : [];

    const selectNode = useCallback(
        (nodeId: string, nodeKind?: WorkflowNodeKind) => {
            const resolvedNodeKind =
                nodeKind ??
                (() => {
                    const nextNode = nodes.find(node => node.id === nodeId);
                    return isWorkflowNodeKind(nextNode?.type) ? nextNode.type : 'screen';
                })();

            setSelectedNodeId(nodeId);
            setSelectedEdgeId(null);
            setInspectorTab(defaultInspectorTab(resolvedNodeKind));
        },
        [nodes]
    );

    const selectEdge = useCallback((edgeId: string) => {
        setSelectedEdgeId(edgeId);
        setSelectedNodeId(null);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
    }, []);

    return {
        selectedNodeId,
        selectedEdgeId,
        selectedNodeKind,
        selectedNodeInspectorTabs,
        inspectorTab,
        setSelectedNodeId,
        setSelectedEdgeId,
        setInspectorTab,
        selectNode,
        selectEdge,
        clearSelection,
    };
}

export { isWorkflowNodeKind, defaultInspectorTab, inspectorTabsForNodeKind, workflowNodeKindLabel };
