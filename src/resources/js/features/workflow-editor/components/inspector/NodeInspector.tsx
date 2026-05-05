import { Link } from '@inertiajs/react';
import { isConditionNodeKind } from '../../lib/utils';
import type { NotificationSeverity, NodeInspectorProps } from './types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';

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
        <div className="mt-5 flex flex-1 flex-col gap-4">
            {selectedNodeKind === 'notification' && (
                <>
                    <div className="space-y-1.5">
                        <Label>Severity</Label>
                        <Select
                            value={
                                (selectedNode.data.severity as NotificationSeverity | undefined) ??
                                'info'
                            }
                            onValueChange={value =>
                                updateNodeData({ severity: value as NotificationSeverity })
                            }
                            disabled={!canEditWorkflows}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="error">Error</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="info">Info</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Text</Label>
                        <Textarea
                            value={(selectedNode.data.text as string | undefined) ?? ''}
                            onChange={event => updateNodeData({ text: event.target.value })}
                            disabled={!canEditWorkflows}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea
                            value={(selectedNode.data.description as string | undefined) ?? ''}
                            onChange={event => updateNodeData({ description: event.target.value })}
                            disabled={!canEditWorkflows}
                            className="min-h-[3.5rem]"
                        />
                    </div>
                </>
            )}

            {isConditionNodeKind(selectedNodeKind) && (
                <>
                    <div className="space-y-1.5">
                        <Label>Condition</Label>
                        <Textarea
                            value={(selectedNode.data.condition as string | undefined) ?? ''}
                            onChange={event => updateNodeData({ condition: event.target.value })}
                            disabled={!canEditWorkflows}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Note</Label>
                        <Textarea
                            value={(selectedNode.data.note as string | undefined) ?? ''}
                            onChange={event => updateNodeData({ note: event.target.value })}
                            disabled={!canEditWorkflows}
                            className="min-h-[3.5rem]"
                        />
                    </div>

                    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                        Select an outgoing connection on the canvas to edit its label.
                    </div>
                </>
            )}

            {selectedNodeKind === 'action' && (
                <>
                    {inspectorTab === 'general' && (
                        <>
                            <div className="space-y-1.5">
                                <Label>Title</Label>
                                <Textarea
                                    value={(selectedNode.data.title as string | undefined) ?? ''}
                                    onChange={event =>
                                        updateNodeData({ title: event.target.value })
                                    }
                                    disabled={!canEditWorkflows}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Note</Label>
                                <Textarea
                                    value={(selectedNode.data.note as string | undefined) ?? ''}
                                    onChange={event => updateNodeData({ note: event.target.value })}
                                    disabled={!canEditWorkflows}
                                    className="min-h-[3.5rem]"
                                />
                            </div>
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
                        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
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
                    <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input
                            value={(selectedNode.data.title as string | undefined) ?? ''}
                            onChange={event => updateNodeData({ title: event.target.value })}
                            disabled={!canEditWorkflows}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Note</Label>
                        <Textarea
                            value={(selectedNode.data.note as string | undefined) ?? ''}
                            onChange={event => updateNodeData({ note: event.target.value })}
                            disabled={!canEditWorkflows}
                            className="min-h-[3.5rem]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Chain to workflow</Label>
                        <Select
                            value={String(
                                (selectedNode.data.linked_workflow_id as
                                    | string
                                    | null
                                    | undefined) ?? ''
                            )}
                            onValueChange={value => {
                                const id = value || null;
                                const name =
                                    projectWorkflows.find(workflow => workflow.id === id)?.name ??
                                    null;
                                updateNodeData({
                                    linked_workflow_id: id,
                                    linked_workflow_name: name,
                                });
                            }}
                            disabled={!canEditWorkflows}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="— None —" />
                            </SelectTrigger>
                            <SelectContent>
                                {projectWorkflows
                                    .filter(workflow => workflow.id !== workflowId)
                                    .map(workflow => (
                                        <SelectItem key={workflow.id} value={workflow.id}>
                                            {workflow.name}
                                            {workflow.status === 'published' ? ' ✓' : ''}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {(selectedNode.data.linked_workflow_id as string | null | undefined) && (
                        <Link
                            href={route('workflows.editor', {
                                workflow: selectedNode.data.linked_workflow_id as string,
                            })}
                            className="inline-flex items-center text-sm text-primary hover:text-primary/80 hover:underline"
                        >
                            Open workflow →
                        </Link>
                    )}
                </>
            )}

            {selectedNodeKind === 'timer' && (
                <>
                    <div className="space-y-1.5">
                        <Label>Timer expression</Label>
                        <Textarea
                            value={(selectedNode.data.text as string | undefined) ?? ''}
                            onChange={event => updateNodeData({ text: event.target.value })}
                            disabled={!canEditWorkflows}
                            placeholder="e.g. wait 2 hours, until next Monday 9:00"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Note</Label>
                        <Textarea
                            value={(selectedNode.data.note as string | undefined) ?? ''}
                            onChange={event => updateNodeData({ note: event.target.value })}
                            disabled={!canEditWorkflows}
                            className="min-h-[3.5rem]"
                        />
                    </div>
                </>
            )}

            {selectedNodeKind === 'subprocess' && (
                <>
                    <div className="space-y-1.5">
                        <Label>Sub-process workflow</Label>
                        <Select
                            value={String(
                                (selectedNode.data.linked_workflow_id as
                                    | string
                                    | null
                                    | undefined) ?? ''
                            )}
                            onValueChange={value => {
                                const id = value || null;
                                const name =
                                    projectWorkflows.find(workflow => workflow.id === id)?.name ??
                                    null;
                                updateNodeData({
                                    linked_workflow_id: id,
                                    linked_workflow_name: name,
                                });
                            }}
                            disabled={!canEditWorkflows}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="— None —" />
                            </SelectTrigger>
                            <SelectContent>
                                {projectWorkflows
                                    .filter(workflow => workflow.id !== workflowId)
                                    .map(workflow => (
                                        <SelectItem key={workflow.id} value={workflow.id}>
                                            {workflow.name}
                                            {workflow.status === 'published' ? ' ✓' : ''}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {(selectedNode.data.linked_workflow_id as string | null | undefined) && (
                        <Link
                            href={route('workflows.editor', {
                                workflow: selectedNode.data.linked_workflow_id as string,
                            })}
                            className="inline-flex items-center text-sm text-primary hover:text-primary/80 hover:underline"
                        >
                            Open sub-process →
                        </Link>
                    )}

                    <div className="space-y-1.5">
                        <Label>Note</Label>
                        <Textarea
                            value={(selectedNode.data.note as string | undefined) ?? ''}
                            onChange={event => updateNodeData({ note: event.target.value })}
                            disabled={!canEditWorkflows}
                            className="min-h-[3.5rem]"
                        />
                    </div>
                </>
            )}

            {selectedNodeKind === 'note' && (
                <div className="space-y-1.5">
                    <Label>Note</Label>
                    <Textarea
                        value={(selectedNode.data.text as string | undefined) ?? ''}
                        onChange={event => updateNodeData({ text: event.target.value })}
                        disabled={!canEditWorkflows}
                    />
                </div>
            )}

            {selectedNode.type !== 'start' && (
                <div className="mt-auto pt-4">
                    <Button
                        type="button"
                        variant="destructive"
                        className="w-full"
                        onClick={() => removeWorkflowNode(selectedNode.id)}
                        disabled={!canEditWorkflows}
                    >
                        Delete Node
                    </Button>
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
        <div className="space-y-1.5">
            <Label>Security rule (additional)</Label>
            <Textarea
                value={value}
                onChange={event =>
                    onChange(event.target.value.length > 0 ? event.target.value : null)
                }
                disabled={disabled}
                className="min-h-[16rem]"
            />
        </div>
    );
}
