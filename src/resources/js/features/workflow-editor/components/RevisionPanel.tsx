import StatusBadge from '@/Components/StatusBadge';
import type { WorkflowRevisionSummary } from '@/types/processAtlas';
import { formatDateTime } from '@/shared/lib/dates';

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
                className={`workflow-info-panel ${
                    revisionsPanelOpen ? 'workflow-info-panel-open' : ''
                }`.trim()}
                aria-hidden={!revisionsPanelOpen}
            >
                <div>
                    <p className="eyebrow">Workflow</p>
                    <h2 className="panel-title mt-2">Detail</h2>
                </div>

                {latestRevision &&
                    !latestRevision.is_published &&
                    !activeRevision?.is_published &&
                    canEditInProject &&
                    !isArchived && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700">
                                Draft name
                                <input
                                    value={editingDraftName}
                                    onChange={event => setEditingDraftName(event.target.value)}
                                    onBlur={async () => {
                                        if (
                                            editingDraftName !== (latestRevision.draft_name ?? '')
                                        ) {
                                            await handleSaveDraftName(editingDraftName);
                                        }
                                    }}
                                    onKeyDown={async event => {
                                        if (event.key === 'Enter') {
                                            event.currentTarget.blur();
                                        }
                                    }}
                                    disabled={isRunningAction}
                                    className="input-shell mt-2"
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
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={handlePublishClick}
                                disabled={isRunningAction}
                                className="btn-primary workflow-wide-button text-sm"
                            >
                                Publish
                            </button>
                        </div>
                    )}

                {/* Drafts */}
                <div className="mt-5">
                    <p className="panel-title">Drafts</p>

                    <div className="revision-timeline mt-3">
                        {revisions.filter(r => !r.is_published).length === 0 ? (
                            <p className="empty-state py-4 text-sm">No drafts yet</p>
                        ) : (
                            revisions
                                .filter(r => !r.is_published)
                                .map(revision => {
                                    const isActive = activeRevision?.id === revision.id;
                                    const isCurrent = latestRevision?.id === revision.id;

                                    return (
                                        <div
                                            key={revision.id}
                                            onClick={() => handleRevisionTimelineClick(revision)}
                                            className={`revision-timeline-item ${
                                                isActive ? 'revision-timeline-item-active' : ''
                                            }`.trim()}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    void handleRevisionTimelineClick(revision);
                                                }
                                            }}
                                        >
                                            <span className="revision-timeline-dot" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-slate-950">
                                                        {revision.draft_name ?? 'Draft'}
                                                    </p>
                                                    <div className="revision-timeline-actions">
                                                        {isCurrent && (
                                                            <StatusBadge tone="brand">
                                                                Current
                                                            </StatusBadge>
                                                        )}
                                                        {canEditInProject && !isArchived && (
                                                            <button
                                                                type="button"
                                                                disabled={isRunningAction}
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setDraftSourceRevisionId(
                                                                        revision.id
                                                                    );
                                                                    setDraftModalOpen(true);
                                                                }}
                                                                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                                                                title="New draft from this revision"
                                                            >
                                                                New Draft
                                                            </button>
                                                        )}
                                                        {canPublishWorkflows &&
                                                            revisions.length > 1 &&
                                                            !isArchived &&
                                                            !revision.is_locked && (
                                                                <button
                                                                    type="button"
                                                                    disabled={isRunningAction}
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        void deleteRevision(
                                                                            revision
                                                                        );
                                                                    }}
                                                                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    title="Delete draft"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                    </div>
                                                </div>
                                                <p className="revision-timeline-meta">
                                                    {revision.creator?.name ?? 'Unknown actor'} ·{' '}
                                                    {formatDateTime(revision.created_at)}
                                                </p>
                                                {revision.source_revision_id && (
                                                    <p className="revision-timeline-meta">
                                                        From rev.{' '}
                                                        {revisions.find(
                                                            v =>
                                                                v.id === revision.source_revision_id
                                                        )?.revision_number ?? '?'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>

                {/* Published Revisions */}
                <div className="mt-5">
                    <p className="panel-title">Published Revisions</p>

                    <div className="revision-timeline mt-3">
                        {revisions.filter(r => r.is_published).length === 0 ? (
                            <p className="empty-state py-4 text-sm">No published revisions</p>
                        ) : (
                            revisions
                                .filter(r => r.is_published)
                                .map(revision => {
                                    const isActive = activeRevision?.id === revision.id;
                                    const isCurrent = latestRevision?.id === revision.id;

                                    return (
                                        <div
                                            key={revision.id}
                                            onClick={() => handleRevisionTimelineClick(revision)}
                                            className={`revision-timeline-item ${
                                                isActive ? 'revision-timeline-item-active' : ''
                                            }`.trim()}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    void handleRevisionTimelineClick(revision);
                                                }
                                            }}
                                        >
                                            <span className="revision-timeline-dot revision-timeline-dot-published" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-slate-950">
                                                        rev. {revision.revision_number}
                                                    </p>
                                                    <div className="revision-timeline-actions">
                                                        {isCurrent && (
                                                            <StatusBadge tone="brand">
                                                                Current
                                                            </StatusBadge>
                                                        )}
                                                        {canEditInProject && !isArchived && (
                                                            <button
                                                                type="button"
                                                                disabled={isRunningAction}
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setDraftSourceRevisionId(
                                                                        revision.id
                                                                    );
                                                                    setDraftModalOpen(true);
                                                                }}
                                                                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                                                                title="New draft from this revision"
                                                            >
                                                                New Draft
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="revision-timeline-meta">
                                                    {revision.creator?.name ?? 'Unknown actor'} ·{' '}
                                                    {formatDateTime(revision.created_at)}
                                                </p>
                                                {revision.source_revision_id && (
                                                    <p className="revision-timeline-meta">
                                                        From rev.{' '}
                                                        {revisions.find(
                                                            v =>
                                                                v.id === revision.source_revision_id
                                                        )?.revision_number ?? '?'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>

                <p className="mt-auto pt-4 text-xs text-slate-400">
                    {lastSavedAt ? formatDateTime(lastSavedAt) : 'Not saved yet'}
                </p>
            </aside>
        </>
    );
}
