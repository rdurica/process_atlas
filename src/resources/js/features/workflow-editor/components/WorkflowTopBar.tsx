import StatusBadge from '@/Components/StatusBadge';
import { Link } from '@inertiajs/react';
import type { WorkflowData, WorkflowRevisionSummary } from '@/types/processAtlas';
import type { GraphState } from '../types';
import { graphTone, graphLabel, workflowTone } from '../lib/utils';
import { Button } from '@/Components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { Undo2, Redo2, Save, RotateCcw, ChevronLeft, FileText } from 'lucide-react';

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
        <TooltipProvider delayDuration={300}>
            <header className="workflow-topbar">
                <div className="flex min-w-0 items-center gap-3">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route('projects.show', workflow.project.id)}>
                            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                            {workflow.project.name}
                        </Link>
                    </Button>
                    <h1 className="max-w-[14rem] truncate text-base font-bold text-foreground">
                        {workflow.name}
                    </h1>
                    <StatusBadge tone={workflowTone(workflow.status)}>
                        {workflow.status}
                    </StatusBadge>
                    {isArchived && <StatusBadge tone="neutral">Archived</StatusBadge>}
                    <span data-testid="graph-save-status">
                        <StatusBadge tone={graphTone(graphState)}>
                            {graphLabel(graphState)}
                        </StatusBadge>
                    </span>
                </div>

                <div className="workflow-actions">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={undo}
                                disabled={!canEditWorkflows || !canUndo}
                            >
                                <Undo2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={redo}
                                disabled={!canEditWorkflows || !canRedo}
                            >
                                <Redo2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                onClick={() => saveGraph('ui')}
                                disabled={!canEditWorkflows || graphState === 'saving'}
                                data-testid="save-workflow-graph"
                            >
                                <Save className="mr-1.5 h-4 w-4" />
                                Save
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save (Ctrl/Cmd+S)</TooltipContent>
                    </Tooltip>

                    {graphState === 'conflict' && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50"
                            onClick={reloadWorkflow}
                        >
                            <RotateCcw className="mr-1.5 h-4 w-4" />
                            Reload Draft
                        </Button>
                    )}

                    <Button variant="outline" size="sm" onClick={() => setRevisionsPanelOpen(true)}>
                        <FileText className="mr-1.5 h-4 w-4" />
                        Detail
                    </Button>
                </div>
                {latestRevision &&
                    !latestRevision.is_published &&
                    workflow.published_revision != null &&
                    latestRevision.source_revision_id !== workflow.published_revision.id && (
                        <div className="absolute inset-x-0 top-full flex items-center justify-center rounded-b-lg border-x border-b border-destructive/20 bg-destructive/10 px-5 py-2">
                            <p className="text-sm font-medium text-destructive">
                                Warning – this draft does not originate from the latest published
                                revision.
                            </p>
                        </div>
                    )}
            </header>
        </TooltipProvider>
    );
}
