import { useEffect, useRef, useCallback } from 'react';

export function useAutosave({
    saveFn,
    dependencies,
    delay = 2000,
    onError,
    enabled = true,
}: {
    saveFn: () => Promise<void>;
    dependencies: unknown[];
    delay?: number;
    onError?: (error: unknown) => void;
    enabled?: boolean;
}) {
    const saveFnRef = useRef(saveFn);
    const onErrorRef = useRef(onError);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitial = useRef(true);

    useEffect(() => {
        saveFnRef.current = saveFn;
        onErrorRef.current = onError;
    });

    const clearTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!enabled) {
            clearTimer();
            return;
        }

        if (isInitial.current) {
            isInitial.current = false;
            return;
        }

        timeoutRef.current = setTimeout(async () => {
            try {
                await saveFnRef.current();
            } catch (error) {
                onErrorRef.current?.(error);
            }
        }, delay);

        return clearTimer;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [delay, enabled, ...dependencies]);

    return { clearTimer };
}
