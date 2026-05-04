import { memo } from 'react';
import StatusBadge from '@/Components/StatusBadge';
import { Link } from '@inertiajs/react';
import type { WorkflowData, WorkflowRevisionSummary } from '@/types/processAtlas';
import { graphTone, graphLabel } from '../lib/utils';
import { useEditorStore } from '../stores/editorStore';
import { Button } from '@/Components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { Undo2, Redo2, Save, RotateCcw, ChevronLeft, FileText } from 'lucide-react';

interface WorkflowTopBarProps {
    workflow: WorkflowData;
    latestRevision: WorkflowRevisionSummary | null;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    saveGraph: (source: 'ui' | 'autosave') => Promise<void>;
    reloadWorkflow: () => void;
}

function WorkflowTopBar({
    workflow,
    latestRevision,
    canUndo,
    canRedo,
    undo,
    redo,
    saveGraph,
    reloadWorkflow,
}: WorkflowTopBarProps) {
    const graphState = useEditorStore(state => state.graphState);
    const canEditWorkflows = useEditorStore(state => state.canEditWorkflows);
    const setRevisionsPanelOpen = useEditorStore(state => state.setRevisionsPanelOpen);
    return (
        <TooltipProvider delayDuration={300}>
            <header className="workflow-topbar">
                <div className="flex w-full items-center justify-between px-3 py-2">
                    <div className="mr-4 flex min-w-0 items-center gap-3">
                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" asChild>
                            <Link href={route('projects.show', workflow.project.id)}>
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
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

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRevisionsPanelOpen(true)}
                        >
                            <FileText className="mr-1.5 h-4 w-4" />
                            Detail
                        </Button>
                    </div>
                </div>

                <div className="flex w-full items-center justify-center border-t border-border/50 bg-muted/30 px-5 py-1.5">
                    <h1 className="text-sm font-medium text-foreground">{workflow.name}</h1>
                </div>

                {latestRevision &&
                    !latestRevision.is_published &&
                    workflow.published_revision != null &&
                    latestRevision.source_revision_id !== workflow.published_revision.id && (
                        <div className="flex w-full items-center justify-center border-t border-destructive/20 bg-destructive/10 px-5 py-2">
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

export default memo(WorkflowTopBar);
