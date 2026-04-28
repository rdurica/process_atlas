import StatusBadge from '@/Components/StatusBadge';
import type { ScreenCustomField } from '@/types/processAtlas';
import type {
    FlashType,
    FieldEditorMode,
    InspectorTab,
    WorkflowNodeKind,
    WorkflowNodeData,
} from '../types';
import { isConditionNodeKind, workflowNodeKindLabel } from '../lib/utils';
import type { Node, Edge } from '@xyflow/react';

interface ScreenEditorState {
    selectedScreen: import('@/types/processAtlas').Screen | null;
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
        if (!selectedNode) return;
        updateNodeData(selectedNode.id, patch);
    };

    return (
        <aside className="workflow-inspector-panel">
            <section>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="eyebrow">Inspector</p>
                        <h2 className="panel-title mt-2">
                            {selectedEdge ? 'Connection' : selectedNode?.id}
                        </h2>
                    </div>
                    {selectedEdge ? (
                        <StatusBadge tone="brand">Edge</StatusBadge>
                    ) : selectedScreen ? (
                        <StatusBadge tone="brand">Saved Screen</StatusBadge>
                    ) : selectedNode ? (
                        <StatusBadge tone="neutral">
                            {workflowNodeKindLabel(selectedNodeKind)}
                        </StatusBadge>
                    ) : null}
                </div>

                {selectedNode && selectedNodeInspectorTabs.length > 0 && (
                    <div
                        className="inspector-tabs mt-5"
                        style={{
                            gridTemplateColumns: `repeat(${selectedNodeInspectorTabs.length}, minmax(0, 1fr))`,
                        }}
                    >
                        {selectedNodeInspectorTabs.map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setInspectorTab(key)}
                                className={`inspector-tab ${
                                    inspectorTab === key ? 'inspector-tab-active' : ''
                                }`.trim()}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {selectedEdge ? (
                    <form onSubmit={saveSelectedEdgeLabel} className="workflow-inline-form mt-5">
                        <div className="workflow-text-row workflow-field-row">
                            <p className="workflow-text-row-title">
                                {selectedEdge.source} to {selectedEdge.target}
                            </p>
                            <p className="workflow-text-row-meta">
                                {isConditionNodeKind(selectedEdgeSourceNode?.type)
                                    ? 'Condition branch'
                                    : 'Connection'}
                            </p>
                        </div>

                        <label className="block text-sm font-medium text-slate-700">
                            Label
                            <input
                                value={edgeDraftLabel}
                                onChange={event => setEdgeDraftLabel(event.target.value)}
                                disabled={!canEditWorkflows}
                                className="input-shell mt-2"
                            />
                        </label>

                        <div className="workflow-inline-actions">
                            <button
                                type="button"
                                onClick={removeSelectedEdge}
                                disabled={!canEditWorkflows}
                                className="btn-danger workflow-action-button"
                            >
                                Delete
                            </button>
                            <button
                                type="submit"
                                disabled={!canEditWorkflows}
                                className="btn-primary workflow-action-button"
                            >
                                Save Label
                            </button>
                        </div>
                    </form>
                ) : selectedNode && selectedNodeKind !== 'screen' ? (
                    <div className="workflow-inline-form mt-5">
                        {selectedNodeKind === 'flash' && (
                            <>
                                <div
                                    className={`workflow-text-row workflow-flash-row-${
                                        (selectedNode.data.type as FlashType | undefined) ?? 'info'
                                    }`}
                                >
                                    <p className="workflow-text-row-title">
                                        {(selectedNode.data.text as string | undefined) ?? 'Flash'}
                                    </p>
                                    <p className="workflow-text-row-meta">
                                        {(selectedNode.data.type as FlashType | undefined) ??
                                            'info'}
                                    </p>
                                </div>

                                <label className="block text-sm font-medium text-slate-700">
                                    Severity
                                    <select
                                        value={
                                            (selectedNode.data.type as FlashType | undefined) ??
                                            'info'
                                        }
                                        onChange={event =>
                                            handleNodeDataUpdate({
                                                type: event.target.value as FlashType,
                                            })
                                        }
                                        disabled={!canEditWorkflows}
                                        className="select-shell mt-2"
                                    >
                                        <option value="error">Error</option>
                                        <option value="warning">Warning</option>
                                        <option value="info">Info</option>
                                        <option value="success">Success</option>
                                    </select>
                                </label>

                                <label className="block text-sm font-medium text-slate-700">
                                    Text
                                    <textarea
                                        value={(selectedNode.data.text as string | undefined) ?? ''}
                                        onChange={event =>
                                            handleNodeDataUpdate({ text: event.target.value })
                                        }
                                        disabled={!canEditWorkflows}
                                        className="textarea-shell mt-2"
                                    />
                                </label>

                                <label className="block text-sm font-medium text-slate-700">
                                    Description
                                    <textarea
                                        value={
                                            (selectedNode.data.description as string | undefined) ??
                                            ''
                                        }
                                        onChange={event =>
                                            handleNodeDataUpdate({
                                                description: event.target.value,
                                            })
                                        }
                                        disabled={!canEditWorkflows}
                                        className="textarea-shell textarea-shell-compact mt-2"
                                    />
                                </label>
                            </>
                        )}

                        {isConditionNodeKind(selectedNodeKind) && (
                            <>
                                <label className="block text-sm font-medium text-slate-700">
                                    Condition
                                    <textarea
                                        value={
                                            (selectedNode.data.condition as string | undefined) ??
                                            ''
                                        }
                                        onChange={event =>
                                            handleNodeDataUpdate({
                                                condition: event.target.value,
                                            })
                                        }
                                        disabled={!canEditWorkflows}
                                        className="textarea-shell mt-2"
                                    />
                                </label>

                                <div className="empty-state">
                                    Select an outgoing connection on the canvas to edit its label.
                                </div>
                            </>
                        )}

                        {selectedNodeKind === 'action' && (
                            <>
                                {inspectorTab === 'general' && (
                                    <>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Title
                                            <textarea
                                                value={
                                                    (selectedNode.data.title as
                                                        | string
                                                        | undefined) ?? ''
                                                }
                                                onChange={event =>
                                                    handleNodeDataUpdate({
                                                        title: event.target.value,
                                                    })
                                                }
                                                disabled={!canEditWorkflows}
                                                className="textarea-shell mt-2"
                                            />
                                        </label>

                                        <label className="block text-sm font-medium text-slate-700">
                                            Description
                                            <textarea
                                                value={
                                                    (selectedNode.data.description as
                                                        | string
                                                        | undefined) ?? ''
                                                }
                                                onChange={event =>
                                                    handleNodeDataUpdate({
                                                        description: event.target.value,
                                                    })
                                                }
                                                disabled={!canEditWorkflows}
                                                className="textarea-shell textarea-shell-compact mt-2"
                                            />
                                        </label>
                                    </>
                                )}

                                {inspectorTab === 'security' && (
                                    <div className="workflow-security-form">
                                        <label className="workflow-security-label block text-sm font-medium text-slate-700">
                                            Security rule (additional)
                                            <textarea
                                                value={
                                                    (selectedNode.data.security_rule as
                                                        | string
                                                        | undefined
                                                        | null) ?? ''
                                                }
                                                onChange={event =>
                                                    handleNodeDataUpdate({
                                                        security_rule:
                                                            event.target.value.length > 0
                                                                ? event.target.value
                                                                : null,
                                                    })
                                                }
                                                disabled={!canEditWorkflows}
                                                className="textarea-shell textarea-shell-security mt-2"
                                            />
                                        </label>
                                    </div>
                                )}
                            </>
                        )}

                        {selectedNodeKind === 'start' && (
                            <>
                                {inspectorTab === 'general' && (
                                    <div className="empty-state">
                                        Entry point of the workflow — no configuration needed.
                                    </div>
                                )}

                                {inspectorTab === 'security' && (
                                    <div className="workflow-security-form">
                                        <label className="workflow-security-label block text-sm font-medium text-slate-700">
                                            Security rule (additional)
                                            <textarea
                                                value={
                                                    (selectedNode.data.security_rule as
                                                        | string
                                                        | undefined
                                                        | null) ?? ''
                                                }
                                                onChange={event =>
                                                    handleNodeDataUpdate({
                                                        security_rule:
                                                            event.target.value.length > 0
                                                                ? event.target.value
                                                                : null,
                                                    })
                                                }
                                                disabled={!canEditWorkflows}
                                                className="textarea-shell textarea-shell-security mt-2"
                                            />
                                        </label>
                                    </div>
                                )}
                            </>
                        )}

                        {selectedNodeKind === 'end' && (
                            <>
                                <label className="block text-sm font-medium text-slate-700">
                                    Label
                                    <input
                                        value={
                                            (selectedNode.data.label as string | undefined) ?? ''
                                        }
                                        onChange={event =>
                                            handleNodeDataUpdate({ label: event.target.value })
                                        }
                                        disabled={!canEditWorkflows}
                                        className="input-shell mt-2"
                                    />
                                </label>

                                <label className="block text-sm font-medium text-slate-700">
                                    Chain to workflow
                                    <select
                                        value={String(
                                            (selectedNode.data.linked_workflow_id as
                                                | number
                                                | null
                                                | undefined) ?? ''
                                        )}
                                        onChange={event => {
                                            const id = event.target.value
                                                ? Number(event.target.value)
                                                : null;
                                            const name =
                                                projectWorkflows.find(w => w.id === id)?.name ??
                                                null;
                                            handleNodeDataUpdate({
                                                linked_workflow_id: id,
                                                linked_workflow_name: name,
                                            });
                                        }}
                                        disabled={!canEditWorkflows}
                                        className="select-shell mt-2"
                                    >
                                        <option value="">— None —</option>
                                        {projectWorkflows
                                            .filter(w => w.id !== workflowId)
                                            .map(w => (
                                                <option key={w.id} value={w.id}>
                                                    {w.name}
                                                    {w.status === 'published' ? ' ✓' : ''}
                                                </option>
                                            ))}
                                    </select>
                                </label>
                            </>
                        )}

                        {selectedNode.type !== 'start' && (
                            <div className="workflow-inline-actions">
                                <button
                                    type="button"
                                    onClick={() => removeWorkflowNode(selectedNode.id)}
                                    disabled={!canEditWorkflows}
                                    className="btn-danger workflow-wide-button"
                                >
                                    Delete Node
                                </button>
                            </div>
                        )}
                    </div>
                ) : selectedNode ? (
                    <div className="mt-5 space-y-5">
                        {inspectorTab === 'screen' && (
                            <form onSubmit={screenEditor.upsertScreen} className="space-y-4">
                                <div className="screen-phone-mockup">
                                    <div className="screen-phone-frame">
                                        <div className="screen-phone-notch" />
                                        <div className="screen-phone-display">
                                            {screenEditor.imageFile ? (
                                                <>
                                                    <img
                                                        src={URL.createObjectURL(
                                                            screenEditor.imageFile
                                                        )}
                                                        alt="Screen preview"
                                                        className="screen-phone-image-fill"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="screen-phone-zoom-btn"
                                                        onClick={() =>
                                                            setPreviewImageUrl(
                                                                URL.createObjectURL(
                                                                    screenEditor.imageFile!
                                                                )
                                                            )
                                                        }
                                                        title="Preview full image"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                                                            />
                                                        </svg>
                                                    </button>
                                                </>
                                            ) : selectedScreen?.image_url ? (
                                                <>
                                                    <img
                                                        src={selectedScreen.image_url}
                                                        alt="Screen preview"
                                                        className="screen-phone-image-fill"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="screen-phone-zoom-btn"
                                                        onClick={() =>
                                                            setPreviewImageUrl(
                                                                selectedScreen.image_url!
                                                            )
                                                        }
                                                        title="Preview full image"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                                                            />
                                                        </svg>
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="screen-phone-placeholder">
                                                    <svg
                                                        className="screen-phone-placeholder-icon"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={1.5}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5A.75.75 0 0121 3.75v13.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 17.25V3.75A.75.75 0 013.75 3z"
                                                        />
                                                    </svg>
                                                    No image
                                                </div>
                                            )}
                                            {(screenEditor.title || screenEditor.subtitle) && (
                                                <div className="screen-phone-meta-overlay">
                                                    {screenEditor.title && (
                                                        <p className="screen-phone-meta-title">
                                                            {screenEditor.title}
                                                        </p>
                                                    )}
                                                    {screenEditor.subtitle && (
                                                        <p className="screen-phone-meta-subtitle">
                                                            {screenEditor.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="screen-image-upload-area">
                                    <label className="screen-image-upload-label">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            style={{
                                                width: '0.9rem',
                                                height: '0.9rem',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                                            />
                                        </svg>
                                        {screenEditor.imageFile
                                            ? 'Change image'
                                            : 'Upload screen image'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={!canEditWorkflows}
                                            style={{ display: 'none' }}
                                            onChange={e => {
                                                const file = e.target.files?.[0] ?? null;
                                                screenEditor.setImageFile(file);
                                            }}
                                        />
                                    </label>
                                    {screenEditor.imageFile && (
                                        <span className="screen-image-selected-name">
                                            {screenEditor.imageFile.name}
                                        </span>
                                    )}
                                </div>

                                <label className="block text-sm font-medium text-slate-700">
                                    Title
                                    <input
                                        value={screenEditor.title}
                                        onChange={event =>
                                            screenEditor.setTitle(event.target.value)
                                        }
                                        className="input-shell mt-2"
                                    />
                                </label>

                                <label className="block text-sm font-medium text-slate-700">
                                    Subtitle
                                    <input
                                        value={screenEditor.subtitle}
                                        onChange={event =>
                                            screenEditor.setSubtitle(event.target.value)
                                        }
                                        className="input-shell mt-2"
                                    />
                                </label>

                                <label className="block text-sm font-medium text-slate-700">
                                    Description
                                    <textarea
                                        value={screenEditor.description}
                                        onChange={event =>
                                            screenEditor.setDescription(event.target.value)
                                        }
                                        className="textarea-shell textarea-shell-large mt-2"
                                    />
                                </label>

                                <button
                                    type="submit"
                                    disabled={!canEditWorkflows || screenEditor.isSavingScreen}
                                    className="btn-primary workflow-wide-button"
                                >
                                    Save Screen
                                </button>
                            </form>
                        )}

                        {inspectorTab === 'fields' && (
                            <div className="workflow-compact-list">
                                {(selectedScreen?.custom_fields ?? []).length > 0 ? (
                                    <div className="space-y-2">
                                        {(selectedScreen?.custom_fields ?? []).map(field => (
                                            <button
                                                key={field.id}
                                                type="button"
                                                className={`workflow-text-row workflow-field-row w-full text-left ${
                                                    screenEditor.editingFieldId === field.id
                                                        ? 'workflow-field-row-active'
                                                        : ''
                                                }`.trim()}
                                                onClick={() => {
                                                    if (canEditWorkflows) {
                                                        screenEditor.openEditFieldEditor(field);
                                                    }
                                                }}
                                                disabled={!canEditWorkflows}
                                            >
                                                <div className="min-w-0">
                                                    <p className="workflow-text-row-title">
                                                        {field.key}
                                                    </p>
                                                    <p className="workflow-text-row-meta">
                                                        {field.value || 'No value'} /{' '}
                                                        {field.field_type}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        No custom fields on this screen yet.
                                    </div>
                                )}

                                {screenEditor.fieldEditorMode === 'hidden' ? (
                                    <button
                                        type="button"
                                        onClick={screenEditor.openCreateFieldEditor}
                                        disabled={!canEditWorkflows}
                                        className="btn-secondary workflow-wide-button"
                                    >
                                        Add Field
                                    </button>
                                ) : (
                                    <form
                                        onSubmit={screenEditor.submitFieldEditor}
                                        className="workflow-inline-form"
                                    >
                                        <div>
                                            <p className="eyebrow">Custom Field</p>
                                            <h3 className="mt-1 text-sm font-bold text-slate-950">
                                                {screenEditor.fieldEditorMode === 'edit'
                                                    ? 'Edit Field'
                                                    : 'Add Field'}
                                            </h3>
                                        </div>

                                        <label className="block text-sm font-medium text-slate-700">
                                            Field key
                                            <input
                                                value={screenEditor.newCustomKey}
                                                onChange={event =>
                                                    screenEditor.setNewCustomKey(event.target.value)
                                                }
                                                className="input-shell mt-2"
                                            />
                                        </label>

                                        <label className="block text-sm font-medium text-slate-700">
                                            Field type
                                            <select
                                                value={screenEditor.newCustomFieldType}
                                                onChange={event =>
                                                    screenEditor.setNewCustomFieldType(
                                                        event.target
                                                            .value as ScreenCustomField['field_type']
                                                    )
                                                }
                                                className="select-shell mt-2"
                                            >
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="json">JSON</option>
                                            </select>
                                        </label>

                                        <label className="block text-sm font-medium text-slate-700">
                                            Field value
                                            <textarea
                                                value={screenEditor.newCustomValue}
                                                onChange={event =>
                                                    screenEditor.setNewCustomValue(
                                                        event.target.value
                                                    )
                                                }
                                                className="textarea-shell mt-2"
                                            />
                                        </label>

                                        <div className="workflow-inline-actions">
                                            {screenEditor.fieldEditorMode === 'edit' &&
                                                screenEditor.editingField && (
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            const removed =
                                                                await screenEditor.removeCustomField(
                                                                    screenEditor.editingField!.id
                                                                );
                                                            if (removed) {
                                                                setActionNotice(
                                                                    'Custom field deleted.'
                                                                );
                                                                screenEditor.closeFieldEditor();
                                                            }
                                                        }}
                                                        disabled={!canEditWorkflows}
                                                        className="btn-danger workflow-action-button"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            <button
                                                type="button"
                                                onClick={screenEditor.closeFieldEditor}
                                                className="btn-secondary workflow-action-button"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={
                                                    !canEditWorkflows ||
                                                    !screenEditor.newCustomKey.trim()
                                                }
                                                className="btn-primary workflow-action-button"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {inspectorTab === 'security' && (
                            <div className="workflow-inline-form workflow-security-form">
                                <label className="workflow-security-label block text-sm font-medium text-slate-700">
                                    Security rule (additional)
                                    <textarea
                                        value={
                                            (selectedNode.data.security_rule as
                                                | string
                                                | undefined
                                                | null) ?? ''
                                        }
                                        onChange={event =>
                                            handleNodeDataUpdate({
                                                security_rule:
                                                    event.target.value.length > 0
                                                        ? event.target.value
                                                        : null,
                                            })
                                        }
                                        disabled={!canEditWorkflows}
                                        className="textarea-shell textarea-shell-security mt-2"
                                    />
                                </label>
                            </div>
                        )}

                        {selectedNode.type !== 'start' && (
                            <div className="workflow-inline-actions">
                                <button
                                    type="button"
                                    onClick={() => removeWorkflowNode(selectedNode.id)}
                                    disabled={!canEditWorkflows}
                                    className="btn-danger workflow-wide-button"
                                >
                                    Delete Node
                                </button>
                            </div>
                        )}
                    </div>
                ) : null}
            </section>
        </aside>
    );
}
