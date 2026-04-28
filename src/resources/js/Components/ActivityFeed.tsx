import { ActivityItem } from '@/types/processAtlas';
import { formatDateTime } from '@/shared/lib/dates';

export default function ActivityFeed({
    title = 'Recent Activity',
    items,
    emptyMessage = 'No activity has been recorded yet.',
    className = '',
}: {
    title?: string;
    items: ActivityItem[];
    emptyMessage?: string;
    className?: string;
}) {
    return (
        <section className={`surface-card p-5 ${className}`.trim()}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="eyebrow">Operations</p>
                    <h2 className="panel-title mt-2">{title}</h2>
                </div>
                <span className="badge badge-neutral">{items.length}</span>
            </div>

            {items.length === 0 ? (
                <div className="empty-state mt-4">{emptyMessage}</div>
            ) : (
                <div className="mt-4 space-y-3">
                    {items.map(item => (
                        <article key={item.id} className="activity-item">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-950">
                                        {item.description}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {item.subject_label} · {item.causer_name}
                                    </p>
                                </div>
                                <span className="badge badge-neutral">{item.event}</span>
                            </div>
                            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                                {formatDateTime(item.created_at)}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
