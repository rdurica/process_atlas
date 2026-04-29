export type WorkflowNodeKind =
    | 'screen'
    | 'notification'
    | 'condition'
    | 'if'
    | 'action'
    | 'timer'
    | 'subprocess'
    | 'note'
    | 'start'
    | 'end';

export type InspectorTab = 'screen' | 'fields' | 'general' | 'security';

export type GraphState = 'saved' | 'dirty' | 'saving' | 'conflict' | 'error';

export type NotificationSeverity = 'error' | 'warning' | 'info' | 'success';

export type FieldEditorMode = 'hidden' | 'create' | 'edit';

export type ScreenNodeData = Record<string, unknown> & {
    label?: string;
    subtitle?: string;
    image_url?: string | null;
    security_rule?: string | null;
};

export type NotificationNodeData = Record<string, unknown> & {
    severity?: NotificationSeverity;
    text?: string;
    description?: string;
};

export type ConditionNodeData = Record<string, unknown> & {
    condition?: string;
};

export type ActionNodeData = Record<string, unknown> & {
    title?: string;
    description?: string;
    security_rule?: string | null;
};

export type TimerNodeData = Record<string, unknown> & {
    text?: string;
};

export type SubprocessNodeData = Record<string, unknown> & {
    linked_workflow_id?: number | null;
    linked_workflow_name?: string | null;
};

export type NoteNodeData = Record<string, unknown> & {
    text?: string;
};

export type StartNodeData = Record<string, unknown> & {
    label?: string;
    security_rule?: string | null;
};

export type EndNodeData = Record<string, unknown> & {
    label?: string;
    linked_workflow_id?: number | null;
    linked_workflow_name?: string | null;
};

export type WorkflowNodeData =
    | ScreenNodeData
    | NotificationNodeData
    | ConditionNodeData
    | ActionNodeData
    | TimerNodeData
    | SubprocessNodeData
    | NoteNodeData
    | StartNodeData
    | EndNodeData;

export interface WorkflowEditorProps {
    workflow: import('@/types/processAtlas').WorkflowData;
    projectWorkflows: { id: number; name: string; status: 'draft' | 'published' }[];
    currentUserRole: 'process_owner' | 'editor' | 'viewer' | null;
}

import type React from 'react';
import type { Node, Edge, OnConnect, OnNodesChange, OnEdgesChange, NodeProps } from '@xyflow/react';

export interface FlowCanvasProps {
    nodes: Node[];
    edges: Edge[];
    nodeTypes: Record<string, React.ComponentType<NodeProps>>;
    onNodesChange: OnNodesChange<Node>;
    onEdgesChange: OnEdgesChange<Edge>;
    onConnect: OnConnect;
    onNodeClick: (event: React.MouseEvent, node: Node) => void;
    onNodeDoubleClick: (event: React.MouseEvent, node: Node) => void;
    onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;
    onEdgeDoubleClick: (event: React.MouseEvent, edge: Edge) => void;
    onPaneClick: () => void;
    onPaneContextMenu?: React.MouseEventHandler<HTMLDivElement>;
    onDropNode: (kind: WorkflowNodeKind, position: { x: number; y: number }) => void;
    editable: boolean;
}
