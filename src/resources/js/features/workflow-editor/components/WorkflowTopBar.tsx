import StatusBadge from '@/Components/StatusBadge';
import { Link } from '@inertiajs/react';
import type { WorkflowData, WorkflowRevisionSummary } from '@/types/processAtlas';
import type { GraphState } from '../types';
import { graphTone, graphLabel, workflowTone } from '../lib/utils';

interface WorkflowTopBarProps {
    workflow: WorkflowData;
    latestRevision: WorkflowRevisionSummary | null;
    graphState: GraphState;
    canEditWorkflows: boolean;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    saveGraph: (source: 'ui' | 'autosave') => Promise<void>;
    isArchived: boolean;
    setRevisionsPanelOpen: (open: boolean) => void;
    reloadWorkflow: () => void;
}

export default function WorkflowTopBar({
    workflow,
    latestRevision,
    graphState,
    canEditWorkflows,
    canUndo,
    canRedo,
    undo,
    redo,
    saveGraph,
    isArchived,
    setRevisionsPanelOpen,
    reloadWorkflow,
}: WorkflowTopBarProps) {
    return (
        <header className="workflow-topbar">
            <div className="flex min-w-0 items-center gap-3">
                <Link
                    href={route('projects.show', workflow.project.id)}
                    className="btn-ghost workflow-action-button"
                >
                    ← {workflow.project.name}
                </Link>
                <h1 className="max-w-[14rem] truncate text-base font-bold text-slate-950">
                    {workflow.name}
                </h1>
                <StatusBadge tone={workflowTone(workflow.status)}>{workflow.status}</StatusBadge>
                {isArchived && <StatusBadge tone="neutral">Archived</StatusBadge>}
                <StatusBadge tone={graphTone(graphState)}>{graphLabel(graphState)}</StatusBadge>
            </div>

            <div className="workflow-actions">
                <button
                    type="button"
                    onClick={undo}
                    disabled={!canEditWorkflows || !canUndo}
                    className="btn-secondary workflow-action-button"
                    title="Undo (Ctrl+Z)"
                >
                    &#x21B6;
                </button>
                <button
                    type="button"
                    onClick={redo}
                    disabled={!canEditWorkflows || !canRedo}
                    className="btn-secondary workflow-action-button"
                    title="Redo (Ctrl+Shift+Z)"
                >
                    &#x21B7;
                </button>
                <button
                    type="button"
                    onClick={() => saveGraph('ui')}
                    disabled={!canEditWorkflows || graphState === 'saving'}
                    className="btn-primary workflow-action-button"
                >
                    Save
                </button>
                {graphState === 'conflict' && (
                    <button
                        type="button"
                        onClick={reloadWorkflow}
                        className="btn-warning workflow-action-button"
                    >
                        ↻ Reload Draft
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => setRevisionsPanelOpen(true)}
                    className="btn-secondary workflow-action-button"
                >
                    Detail
                </button>
            </div>
            {latestRevision &&
                !latestRevision.is_published &&
                workflow.published_revision != null &&
                latestRevision.source_revision_id !== workflow.published_revision.id && (
                    <div className="absolute inset-x-0 top-full flex items-center justify-center rounded-b-lg border-x border-b border-red-200 bg-red-50 px-5 py-2">
                        <p className="text-sm font-medium text-red-900">
                            Warning – this draft does not originate from the latest published
                            revision.
                        </p>
                    </div>
                )}
        </header>
    );
}
