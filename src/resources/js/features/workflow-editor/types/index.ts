export type WorkflowNodeKind = 'screen' | 'flash' | 'condition' | 'if' | 'action' | 'start' | 'end';

export type InspectorTab = 'screen' | 'fields' | 'general' | 'security';

export type GraphState = 'saved' | 'dirty' | 'saving' | 'conflict' | 'error';

export type FlashType = 'error' | 'warning' | 'info' | 'success';

export type FieldEditorMode = 'hidden' | 'create' | 'edit';

export type ScreenNodeData = Record<string, unknown> & {
    label?: string;
    subtitle?: string;
    image_url?: string | null;
    security_rule?: string | null;
};

export type FlashNodeData = Record<string, unknown> & {
    type?: FlashType;
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
    | FlashNodeData
    | ConditionNodeData
    | ActionNodeData
    | StartNodeData
    | EndNodeData;

export interface WorkflowEditorProps {
    workflow: import('@/types/processAtlas').WorkflowData;
    projectWorkflows: { id: number; name: string; status: 'draft' | 'published' }[];
    currentUserRole: 'process_owner' | 'editor' | 'viewer' | null;
}

export interface FlowCanvasProps {
    nodes: import('@xyflow/react').Node[];
    edges: import('@xyflow/react').Edge[];
    nodeTypes: Record<string, React.ComponentType<import('@xyflow/react').NodeProps>>;
    onNodesChange: (...args: unknown[]) => void;
    onEdgesChange: (...args: unknown[]) => void;
    onConnect: import('@xyflow/react').OnConnect;
    onNodeClick: (event: React.MouseEvent, node: import('@xyflow/react').Node) => void;
    onNodeDoubleClick: (event: React.MouseEvent, node: import('@xyflow/react').Node) => void;
    onEdgeClick: (event: React.MouseEvent, edge: import('@xyflow/react').Edge) => void;
    onEdgeDoubleClick: (event: React.MouseEvent, edge: import('@xyflow/react').Edge) => void;
    onPaneClick: () => void;
    onDropNode: (kind: WorkflowNodeKind, position: { x: number; y: number }) => void;
    editable: boolean;
}
