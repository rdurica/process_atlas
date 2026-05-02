import { Badge } from '@/Components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/Components/ui/badge';
import type { PropsWithChildren } from 'react';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const toneToVariant: Record<Tone, VariantProps<typeof badgeVariants>['variant']> = {
    neutral: 'secondary',
    brand: 'subtle',
    success: 'success',
    warning: 'warning',
    danger: 'destructive',
};

export default function StatusBadge({
    tone = 'neutral',
    children,
}: PropsWithChildren<{ tone?: Tone }>) {
    return <Badge variant={toneToVariant[tone]}>{children}</Badge>;
}
