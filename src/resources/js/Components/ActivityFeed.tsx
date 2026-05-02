import { ActivityItem } from '@/types/processAtlas';
import { formatDateTime } from '@/shared/lib/dates';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';

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
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            Operations
                        </p>
                        <CardTitle className="mt-1.5 text-base">{title}</CardTitle>
                    </div>
                    <Badge variant="secondary">{items.length}</Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
                        {emptyMessage}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map(item => (
                            <article key={item.id} className="rounded-lg border bg-card p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {item.description}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {item.subject_label} · {item.causer_name}
                                        </p>
                                    </div>
                                    <Badge variant="secondary">{item.event}</Badge>
                                </div>
                                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                    {formatDateTime(item.created_at)}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
