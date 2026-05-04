import type { Node } from '@xyflow/react';
import type { Screen } from '@/types/processAtlas';
import type { GraphState, InspectorTab, WorkflowNodeData, WorkflowNodeKind } from '../types';

export const conditionOutputHandles = ['out-1', 'out-2', 'out-3', 'out-4', 'out-5'];

const NODE_KIND_PREFIX: Record<WorkflowNodeKind, string> = {
    screen: 'SCR',
    notification: 'NOT',
    condition: 'CON',
    if: 'CON',
    action: 'ACT',
    timer: 'TMR',
    subprocess: 'SUB',
    note: 'NTE',
    start: 'STR',
    end: 'END',
};

export function generateNodeId(kind: WorkflowNodeKind): string {
    return `${NODE_KIND_PREFIX[kind]}-${crypto.randomUUID()}`;
}

export function nodeDisplayLabel(node: Node): string {
    const data = node.data as Record<string, unknown>;

    switch (node.type) {
        case 'screen':
            return (data.label as string) || 'Untitled Screen';
        case 'notification':
            return (data.text as string) || 'Notification';
        case 'condition':
        case 'if': {
            const condition = (data.condition as string) || '';
            return condition.length > 30 ? condition.slice(0, 30) + '…' : condition || 'Condition';
        }
        case 'action':
            return (data.title as string) || 'Untitled Action';
        case 'timer':
            return (data.text as string) || 'Timer';
        case 'subprocess':
            return (data.linked_workflow_name as string) || 'Sub-process';
        case 'note':
            return (data.text as string) || 'Note';
        case 'start':
            return (data.label as string) || 'Start';
        case 'end':
            return (data.title as string) || 'End';
        default:
            return node.id;
    }
}

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
                          label: screen?.title ?? node.data?.label,
                          subtitle: screen?.subtitle ?? node.data?.subtitle ?? '',
                          image_url: screen?.image_url ?? null,
                          drawing_image_url: screen?.drawing_image_url ?? null,
                          drawing_json: screen?.drawing_json ?? null,
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
        value === 'notification' ||
        value === 'condition' ||
        value === 'if' ||
        value === 'action' ||
        value === 'timer' ||
        value === 'subprocess' ||
        value === 'note' ||
        value === 'start' ||
        value === 'end'
    );
}

export function isConditionNodeKind(value: string | undefined): boolean {
    return value === 'condition' || value === 'if';
}

export function workflowNodeKindLabel(value: WorkflowNodeKind): string {
    if (value === 'if') return 'Condition';
    if (value === 'subprocess') return 'Sub-process';
    return value.charAt(0).toUpperCase() + value.slice(1);
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

export function createNodeData(kind: Exclude<WorkflowNodeKind, 'screen' | 'if'>): WorkflowNodeData {
    switch (kind) {
        case 'notification':
            return {
                severity: 'info',
                text: 'Notification',
                description: '',
            };
        case 'condition':
            return {
                condition: 'Condition',
                note: '',
            };
        case 'timer':
            return {
                text: 'Timer',
                note: '',
            };
        case 'subprocess':
            return {
                linked_workflow_id: null,
                linked_workflow_name: null,
                note: '',
            };
        case 'note':
            return {
                text: 'Note',
            };
        case 'start':
            return {
                label: 'Start',
                security_rule: null,
            };
        case 'end':
            return {
                title: 'End',
                linked_workflow_id: null,
                linked_workflow_name: null,
                note: '',
            };
        case 'action':
        default:
            return {
                title: 'Action',
                note: '',
                security_rule: null,
            };
    }
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
