import type { Node } from '@xyflow/react';
import type { Screen } from '@/types/processAtlas';
import type { GraphState, InspectorTab, WorkflowNodeKind } from '../types';

export const conditionOutputHandles = ['out-1', 'out-2', 'out-3', 'out-4', 'out-5'];

export function buildInitialNodes(nodes: Node[] | undefined, screens: Screen[] = []): Node[] {
    const screenByNodeId = new Map(screens.map(screen => [screen.node_id, screen]));

    if (!nodes || nodes.length === 0) {
        return [
            {
                id: 'start-1',
                type: 'start',
                data: { label: 'Start' },
                position: { x: 140, y: 200 },
            },
        ];
    }

    return nodes.map(node => {
        const nodeType = (node.type ?? 'screen') as WorkflowNodeKind;
        const screen = nodeType === 'screen' ? screenByNodeId.get(node.id) : null;

        return {
            ...node,
            type: nodeType,
            data: {
                ...node.data,
                ...(nodeType === 'screen'
                    ? {
                          label: screen?.title || node.data?.label || node.id,
                          subtitle: screen?.subtitle ?? node.data?.subtitle ?? '',
                          image_url: screen?.image_url ?? null,
                      }
                    : {}),
            },
        };
    });
}

export function graphTone(graphState: GraphState) {
    switch (graphState) {
        case 'saved':
            return 'success';
        case 'dirty':
            return 'warning';
        case 'saving':
            return 'brand';
        case 'conflict':
        case 'error':
            return 'danger';
        default:
            return 'neutral';
    }
}

export function graphLabel(graphState: GraphState) {
    switch (graphState) {
        case 'saved':
            return 'Saved';
        case 'dirty':
            return 'Unsaved';
        case 'saving':
            return 'Saving';
        case 'conflict':
            return 'Conflict';
        case 'error':
            return 'Failed';
    }
}

export function workflowTone(status: 'draft' | 'published') {
    return status === 'published' ? 'success' : 'warning';
}

export function isWorkflowNodeKind(value: string | undefined): value is WorkflowNodeKind {
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

export function isConditionNodeKind(value: string | undefined): boolean {
    return value === 'condition' || value === 'if';
}

export function workflowNodeKindLabel(value: WorkflowNodeKind): string {
    if (value === 'if') return 'condition';
    return value;
}

export function conditionOutputLabel(sourceHandle?: string | null): string {
    const handleNumber = Number(sourceHandle?.replace('out-', ''));

    return Number.isInteger(handleNumber) && handleNumber >= 1 && handleNumber <= 5
        ? `Output ${handleNumber}`
        : 'Output';
}

export function defaultInspectorTab(nodeKind: WorkflowNodeKind): InspectorTab {
    if (nodeKind === 'screen') {
        return 'screen';
    }

    if (nodeKind === 'action' || nodeKind === 'start') {
        return 'general';
    }

    return 'general';
}

export function inspectorTabsForNodeKind(nodeKind: WorkflowNodeKind): [InspectorTab, string][] {
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
