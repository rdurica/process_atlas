export function formatDateTime(value?: string | null, fallback = 'Unknown time'): string {
    if (!value) {
        return fallback;
    }

    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export function formatDate(value?: string | null, fallback = '—'): string {
    if (!value) {
        return fallback;
    }

    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}
