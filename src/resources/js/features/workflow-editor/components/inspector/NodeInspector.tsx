import { isConditionNodeKind } from '../../lib/utils';
import type { NotificationSeverity, NodeInspectorProps } from './types';

export default function NodeInspector({
    selectedNode,
    selectedNodeKind,
    inspectorTab,
    canEditWorkflows,
    projectWorkflows,
    workflowId,
    updateNodeData,
    removeWorkflowNode,
}: NodeInspectorProps) {
    return (
        <div className="workflow-inline-form mt-5">
            {selectedNodeKind === 'notification' && (
                <>
                    <div
                        className={`workflow-text-row workflow-notification-row-${
                            (selectedNode.data.severity as NotificationSeverity | undefined) ??
                            'info'
                        }`}
                    >
                        <p className="workflow-text-row-title">
                            {(selectedNode.data.text as string | undefined) ?? 'Notification'}
                        </p>
                        <p className="workflow-text-row-meta">
                            {(selectedNode.data.severity as NotificationSeverity | undefined) ??
                                'info'}
                        </p>
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                        Severity
                        <select
                            value={
                                (selectedNode.data.severity as NotificationSeverity | undefined) ??
                                'info'
                            }
                            onChange={event =>
                                updateNodeData({
                                    severity: event.target.value as NotificationSeverity,
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
                            onChange={event => updateNodeData({ text: event.target.value })}
                            disabled={!canEditWorkflows}
                            className="textarea-shell mt-2"
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Description
                        <textarea
                            value={(selectedNode.data.description as string | undefined) ?? ''}
                            onChange={event =>
                                updateNodeData({
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
                            value={(selectedNode.data.condition as string | undefined) ?? ''}
                            onChange={event => updateNodeData({ condition: event.target.value })}
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
                                    value={(selectedNode.data.title as string | undefined) ?? ''}
                                    onChange={event =>
                                        updateNodeData({
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
                                        (selectedNode.data.description as string | undefined) ?? ''
                                    }
                                    onChange={event =>
                                        updateNodeData({
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
                        <SecurityRuleField
                            value={
                                (selectedNode.data.security_rule as string | undefined | null) ?? ''
                            }
                            disabled={!canEditWorkflows}
                            onChange={value => updateNodeData({ security_rule: value })}
                        />
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
                        <SecurityRuleField
                            value={
                                (selectedNode.data.security_rule as string | undefined | null) ?? ''
                            }
                            disabled={!canEditWorkflows}
                            onChange={value => updateNodeData({ security_rule: value })}
                        />
                    )}
                </>
            )}

            {selectedNodeKind === 'end' && (
                <>
                    <label className="block text-sm font-medium text-slate-700">
                        Label
                        <input
                            value={(selectedNode.data.label as string | undefined) ?? ''}
                            onChange={event => updateNodeData({ label: event.target.value })}
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
                                const id = event.target.value ? Number(event.target.value) : null;
                                const name =
                                    projectWorkflows.find(workflow => workflow.id === id)?.name ??
                                    null;
                                updateNodeData({
                                    linked_workflow_id: id,
                                    linked_workflow_name: name,
                                });
                            }}
                            disabled={!canEditWorkflows}
                            className="select-shell mt-2"
                        >
                            <option value="">— None —</option>
                            {projectWorkflows
                                .filter(workflow => workflow.id !== workflowId)
                                .map(workflow => (
                                    <option key={workflow.id} value={workflow.id}>
                                        {workflow.name}
                                        {workflow.status === 'published' ? ' ✓' : ''}
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
    );
}

function SecurityRuleField({
    value,
    disabled,
    onChange,
}: {
    value: string;
    disabled: boolean;
    onChange: (value: string | null) => void;
}) {
    return (
        <div className="workflow-security-form">
            <label className="workflow-security-label block text-sm font-medium text-slate-700">
                Security rule (additional)
                <textarea
                    value={value}
                    onChange={event =>
                        onChange(event.target.value.length > 0 ? event.target.value : null)
                    }
                    disabled={disabled}
                    className="textarea-shell textarea-shell-security mt-2"
                />
            </label>
        </div>
    );
}
