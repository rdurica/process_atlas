import type { Edge, Node } from '@xyflow/react';
import type { Screen, ScreenCustomField } from '@/types/processAtlas';
import type {
    FieldEditorMode,
    NotificationSeverity,
    InspectorTab,
    WorkflowNodeData,
    WorkflowNodeKind,
} from '../../types';

export interface ScreenEditorState {
    selectedScreen: Screen | null;
    isSavingScreen: boolean;
    title: string;
    setTitle: (title: string) => void;
    subtitle: string;
    setSubtitle: (subtitle: string) => void;
    description: string;
    setDescription: (description: string) => void;
    imageFile: File | null;
    setImageFile: (file: File | null) => void;
    fieldEditorMode: FieldEditorMode;
    editingFieldId: number | null;
    newCustomKey: string;
    setNewCustomKey: (key: string) => void;
    newCustomValue: string;
    setNewCustomValue: (value: string) => void;
    newCustomFieldType: ScreenCustomField['field_type'];
    setNewCustomFieldType: (type: ScreenCustomField['field_type']) => void;
    editingField: ScreenCustomField | null;
    setFieldEditorMode: (mode: FieldEditorMode) => void;
    setEditingFieldId: (id: number | null) => void;
    openCreateFieldEditor: () => void;
    openEditFieldEditor: (field: ScreenCustomField) => void;
    closeFieldEditor: () => void;
    upsertScreen: (event: React.FormEvent) => Promise<void>;
    submitFieldEditor: (event: React.FormEvent) => Promise<void>;
    removeCustomField: (fieldId: number) => Promise<boolean>;
}

export type NodeDataPatchHandler = (patch: Partial<WorkflowNodeData>) => void;

export interface EdgeInspectorProps {
    selectedEdge: Edge;
    selectedEdgeSourceNode: Node | null;
    canEditWorkflows: boolean;
    edgeDraftLabel: string;
    setEdgeDraftLabel: (label: string) => void;
    saveSelectedEdgeLabel: (event: React.FormEvent) => void;
    removeSelectedEdge: () => void;
}

export interface NodeInspectorProps {
    selectedNode: Node;
    selectedNodeKind: WorkflowNodeKind;
    inspectorTab: InspectorTab;
    canEditWorkflows: boolean;
    projectWorkflows: { id: number; name: string; status: 'draft' | 'published' }[];
    workflowId: number;
    updateNodeData: NodeDataPatchHandler;
    removeWorkflowNode: (nodeId: string) => void;
}

export interface ScreenInspectorProps {
    selectedNode: Node;
    selectedScreen: Screen | null;
    inspectorTab: InspectorTab;
    canEditWorkflows: boolean;
    screenEditor: ScreenEditorState;
    updateNodeData: NodeDataPatchHandler;
    removeWorkflowNode: (nodeId: string) => void;
    setPreviewImageUrl: (url: string | null) => void;
    setActionNotice: (notice: string | null) => void;
}

export type { NotificationSeverity, ScreenCustomField };
