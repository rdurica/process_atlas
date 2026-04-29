import { isConditionNodeKind } from '../../lib/utils';
import type { EdgeInspectorProps } from './types';

export default function EdgeInspector({
    selectedEdge,
    selectedEdgeSourceNode,
    canEditWorkflows,
    edgeDraftLabel,
    setEdgeDraftLabel,
    saveSelectedEdgeLabel,
    removeSelectedEdge,
}: EdgeInspectorProps) {
    return (
        <form
            onSubmit={saveSelectedEdgeLabel}
            className="workflow-inline-form mt-5 flex flex-1 flex-col"
        >
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

            <div className="workflow-inline-actions mt-auto">
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
    );
}
