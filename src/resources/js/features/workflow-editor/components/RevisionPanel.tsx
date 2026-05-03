import type { WorkflowRevisionSummary } from '@/types/processAtlas';
import { formatDateTime } from '@/shared/lib/dates';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Separator } from '@/Components/ui/separator';
import { cn } from '@/lib/utils';

interface RevisionPanelProps {
    revisions: WorkflowRevisionSummary[];
    latestRevision: WorkflowRevisionSummary | null;
    activeRevision: WorkflowRevisionSummary | null;
    canEditInProject: boolean;
    canPublishWorkflows: boolean;
    isArchived: boolean;
    isRunningAction: boolean;
    editingDraftName: string;
    setEditingDraftName: (name: string) => void;
    handleSaveDraftName: (name: string) => Promise<void>;
    handlePublishClick: () => void;
    handleRevisionTimelineClick: (revision: WorkflowRevisionSummary) => Promise<void>;
    deleteRevision: (revision: WorkflowRevisionSummary) => Promise<void>;
    lastSavedAt: string | null;
    revisionsPanelOpen: boolean;
    setRevisionsPanelOpen: (open: boolean) => void;
    setDraftSourceRevisionId: (id: number | undefined) => void;
    setDraftModalOpen: (open: boolean) => void;
}

export default function RevisionPanel({
    revisions,
    latestRevision,
    activeRevision,
    canEditInProject,
    canPublishWorkflows,
    isArchived,
    isRunningAction,
    editingDraftName,
    setEditingDraftName,
    handleSaveDraftName,
    handlePublishClick,
    handleRevisionTimelineClick,
    deleteRevision,
    lastSavedAt,
    revisionsPanelOpen,
    setRevisionsPanelOpen,
    setDraftSourceRevisionId,
    setDraftModalOpen,
}: RevisionPanelProps) {
    return (
        <>
            {revisionsPanelOpen && (
                <button
                    type="button"
                    className="workflow-panel-backdrop"
                    onClick={() => setRevisionsPanelOpen(false)}
                    aria-label="Close revisions panel"
                />
            )}

            <aside
                className={cn(
                    'workflow-info-panel',
                    revisionsPanelOpen && 'workflow-info-panel-open'
                )}
                aria-hidden={!revisionsPanelOpen}
            >
                <Card className="glass-strong flex h-full flex-col">
                    <CardHeader className="pb-2">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Workflow
                            </p>
                            <CardTitle className="mt-1 text-base">Detail</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col">
                        <ScrollArea className="flex-1">
                            <div className="space-y-4 pr-3">
                                {latestRevision &&
                                    !latestRevision.is_published &&
                                    !activeRevision?.is_published &&
                                    canEditInProject &&
                                    !isArchived && (
                                        <div>
                                            <label className="block text-sm font-medium text-foreground">
                                                Draft name
                                                <Input
                                                    value={editingDraftName}
                                                    onChange={event =>
                                                        setEditingDraftName(event.target.value)
                                                    }
                                                    onBlur={async () => {
                                                        if (
                                                            editingDraftName !==
                                                            (latestRevision.draft_name ?? '')
                                                        ) {
                                                            await handleSaveDraftName(
                                                                editingDraftName
                                                            );
                                                        }
                                                    }}
                                                    onKeyDown={async event => {
                                                        if (event.key === 'Enter') {
                                                            event.currentTarget.blur();
                                                        }
                                                    }}
                                                    disabled={isRunningAction}
                                                    className="mt-1.5"
                                                    placeholder="Draft name"
                                                />
                                            </label>
                                        </div>
                                    )}

                                {canPublishWorkflows &&
                                    latestRevision &&
                                    !latestRevision.is_published &&
                                    !activeRevision?.is_published &&
                                    !isArchived && (
                                        <Button
                                            className="w-full"
                                            onClick={handlePublishClick}
                                            disabled={isRunningAction}
                                        >
                                            Publish
                                        </Button>
                                    )}

                                {/* Drafts */}
                                <div>
                                    <p className="text-sm font-semibold">Drafts</p>
                                    <div className="mt-2 space-y-1">
                                        {revisions.filter(r => !r.is_published).length === 0 ? (
                                            <p className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
                                                No drafts yet
                                            </p>
                                        ) : (
                                            revisions
                                                .filter(r => !r.is_published)
                                                .map(revision => {
                                                    const isActive =
                                                        activeRevision?.id === revision.id;
                                                    const isCurrent =
                                                        latestRevision?.id === revision.id;

                                                    return (
                                                        <RevisionItem
                                                            key={revision.id}
                                                            revision={revision}
                                                            isActive={isActive}
                                                            isCurrent={isCurrent}
                                                            isPublished={false}
                                                            canEditInProject={canEditInProject}
                                                            canPublishWorkflows={
                                                                canPublishWorkflows
                                                            }
                                                            isArchived={isArchived}
                                                            isRunningAction={isRunningAction}
                                                            revisions={revisions}
                                                            onClick={() =>
                                                                handleRevisionTimelineClick(
                                                                    revision
                                                                )
                                                            }
                                                            onNewDraft={() => {
                                                                setDraftSourceRevisionId(
                                                                    revision.id
                                                                );
                                                                setDraftModalOpen(true);
                                                            }}
                                                            onDelete={() =>
                                                                deleteRevision(revision)
                                                            }
                                                        />
                                                    );
                                                })
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                {/* Published Revisions */}
                                <div>
                                    <p className="text-sm font-semibold">Published Revisions</p>
                                    <div className="mt-2 space-y-1">
                                        {revisions.filter(r => r.is_published).length === 0 ? (
                                            <p className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
                                                No published revisions
                                            </p>
                                        ) : (
                                            revisions
                                                .filter(r => r.is_published)
                                                .map(revision => {
                                                    const isActive =
                                                        activeRevision?.id === revision.id;
                                                    const isCurrent =
                                                        latestRevision?.id === revision.id;

                                                    return (
                                                        <RevisionItem
                                                            key={revision.id}
                                                            revision={revision}
                                                            isActive={isActive}
                                                            isCurrent={isCurrent}
                                                            isPublished={true}
                                                            canEditInProject={canEditInProject}
                                                            canPublishWorkflows={
                                                                canPublishWorkflows
                                                            }
                                                            isArchived={isArchived}
                                                            isRunningAction={isRunningAction}
                                                            revisions={revisions}
                                                            onClick={() =>
                                                                handleRevisionTimelineClick(
                                                                    revision
                                                                )
                                                            }
                                                            onNewDraft={() => {
                                                                setDraftSourceRevisionId(
                                                                    revision.id
                                                                );
                                                                setDraftModalOpen(true);
                                                            }}
                                                        />
                                                    );
                                                })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <p className="mt-4 border-t pt-2 text-xs text-muted-foreground">
                            {lastSavedAt ? formatDateTime(lastSavedAt) : 'Not saved yet'}
                        </p>
                    </CardContent>
                </Card>
            </aside>
        </>
    );
}

function RevisionItem({
    revision,
    isActive,
    isCurrent,
    isPublished,
    canEditInProject,
    canPublishWorkflows,
    isArchived,
    isRunningAction,
    revisions,
    onClick,
    onNewDraft,
    onDelete,
}: {
    revision: WorkflowRevisionSummary;
    isActive: boolean;
    isCurrent: boolean;
    isPublished: boolean;
    canEditInProject: boolean;
    canPublishWorkflows: boolean;
    isArchived: boolean;
    isRunningAction: boolean;
    revisions: WorkflowRevisionSummary[];
    onClick: () => void;
    onNewDraft: () => void;
    onDelete?: () => void;
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            className={cn(
                'w-full rounded-lg border p-3 text-left transition-all',
                isActive
                    ? 'border-primary/30 bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:bg-accent/50'
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                    {isPublished
                        ? `rev. ${revision.revision_number}`
                        : (revision.draft_name ?? 'Draft')}
                </p>
                <div className="flex items-center gap-1">
                    {isCurrent && <Badge variant="subtle">Current</Badge>}
                </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
                {revision.creator?.name ?? 'Unknown actor'} · {formatDateTime(revision.created_at)}
            </p>
            {revision.source_revision_id && (
                <p className="text-xs text-muted-foreground">
                    From rev.{' '}
                    {revisions.find(v => v.id === revision.source_revision_id)?.revision_number ??
                        '?'}
                </p>
            )}
            <div className="mt-2 flex items-center gap-1">
                {canEditInProject && !isArchived && (
                    <Button
                        variant="outline"
                        size="xs"
                        disabled={isRunningAction}
                        onClick={e => {
                            e.stopPropagation();
                            onNewDraft();
                        }}
                    >
                        New Draft
                    </Button>
                )}
                {canPublishWorkflows &&
                    onDelete &&
                    revisions.length > 1 &&
                    !isArchived &&
                    !revision.is_locked && (
                        <Button
                            variant="outline"
                            size="xs"
                            className="text-destructive hover:bg-destructive/10"
                            disabled={isRunningAction}
                            onClick={e => {
                                e.stopPropagation();
                                onDelete();
                            }}
                        >
                            Delete
                        </Button>
                    )}
            </div>
        </div>
    );
}
