import { PropsWithChildren } from 'react';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const toneClasses: Record<Tone, string> = {
    neutral: 'badge-neutral',
    brand: 'badge-brand',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
};

export default function StatusBadge({
    tone = 'neutral',
    children,
}: PropsWithChildren<{ tone?: Tone }>) {
    return <span className={`badge ${toneClasses[tone]}`}>{children}</span>;
}
