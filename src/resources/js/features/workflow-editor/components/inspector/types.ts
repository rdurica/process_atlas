import type { Edge, Node } from '@xyflow/react';
import type { Screen, ScreenCustomField } from '@/types/processAtlas';
import type { DrawingTool } from './drawing';
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
    note: string;
    setNote: (note: string) => void;
    imageFile: File | null;
    setImageFile: (file: File | null) => void;
    drawingJson: string;
    setDrawingJson: (json: string) => void;
    drawingChanged: boolean;
    setDrawingChanged: (changed: boolean) => void;
    drawingTool: DrawingTool;
    setDrawingTool: (tool: DrawingTool) => void;
    drawingColor: string;
    setDrawingColor: (color: string) => void;
    drawingStrokeWidth: number;
    setDrawingStrokeWidth: (width: number) => void;
    fieldEditorMode: FieldEditorMode;
    editingFieldId: string | null;
    newCustomKey: string;
    setNewCustomKey: (key: string) => void;
    newCustomValue: string;
    setNewCustomValue: (value: string) => void;
    newCustomFieldType: ScreenCustomField['field_type'];
    setNewCustomFieldType: (type: ScreenCustomField['field_type']) => void;
    editingField: ScreenCustomField | null;
    setFieldEditorMode: (mode: FieldEditorMode) => void;
    setEditingFieldId: (id: string | null) => void;
    openCreateFieldEditor: () => void;
    openEditFieldEditor: (field: ScreenCustomField) => void;
    closeFieldEditor: () => void;
    saveDrawing: (
        canvasRef: React.RefObject<{
            getShapesJson: () => string;
            getPngBlob: () => Promise<Blob | null>;
        }>
    ) => Promise<void>;
    saveDrawingDirect: (json: string, blob: Blob | null) => Promise<void>;
    upsertScreen: (event: React.FormEvent) => Promise<void>;
    submitFieldEditor: (event: React.FormEvent) => Promise<void>;
    removeCustomField: (fieldId: string) => Promise<boolean>;
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
    projectWorkflows: { id: string; name: string; status: 'draft' | 'published' }[];
    workflowId: string;
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
