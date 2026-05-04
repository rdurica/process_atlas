import { useCallback } from 'react';
import { useEditorStore } from '../stores/editorStore';
import type { WorkflowNodeKind } from '../types';

export function useEditorSelection() {
    const selectedNodeId = useEditorStore(state => state.selectedNodeId);
    const selectedEdgeId = useEditorStore(state => state.selectedEdgeId);
    const inspectorTab = useEditorStore(state => state.inspectorTab);
    const screens = useEditorStore(state => state.screens);
    const selectNode = useEditorStore(state => state.selectNode);
    const selectEdge = useEditorStore(state => state.selectEdge);
    const clearSelection = useEditorStore(state => state.clearSelection);
    const setInspectorTab = useEditorStore(state => state.setInspectorTab);

    const selectedScreen = selectedNodeId
        ? (screens.find(screen => screen.node_id === selectedNodeId) ?? null)
        : null;

    const handleSelectNode = useCallback(
        (nodeId: string, nodeKind?: WorkflowNodeKind) => {
            selectNode(nodeId, nodeKind);
        },
        [selectNode]
    );

    const handleSelectEdge = useCallback(
        (edgeId: string) => {
            selectEdge(edgeId);
        },
        [selectEdge]
    );

    const handleClearSelection = useCallback(() => {
        clearSelection();
    }, [clearSelection]);

    return {
        selectedNodeId,
        selectedEdgeId,
        inspectorTab,
        selectedScreen,
        selectNode: handleSelectNode,
        selectEdge: handleSelectEdge,
        clearSelection: handleClearSelection,
        setInspectorTab,
    };
}
