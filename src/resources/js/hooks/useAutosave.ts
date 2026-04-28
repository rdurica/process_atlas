import { useEffect, useRef, useCallback } from 'react';

export function useAutosave({
    saveFn,
    dependencies,
    delay = 2000,
    minInterval = 0,
    onError,
    enabled = true,
}: {
    saveFn: () => Promise<void>;
    dependencies: unknown[];
    delay?: number;
    minInterval?: number;
    onError?: (error: unknown) => void;
    enabled?: boolean;
}) {
    const saveFnRef = useRef(saveFn);
    const onErrorRef = useRef(onError);
    const minIntervalRef = useRef(minInterval);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitial = useRef(true);
    const lastSaveTimeRef = useRef(0);

    useEffect(() => {
        saveFnRef.current = saveFn;
        onErrorRef.current = onError;
        minIntervalRef.current = minInterval;
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

        const runSave = async () => {
            if (minIntervalRef.current > 0) {
                const now = Date.now();
                const timeSinceLastSave = now - lastSaveTimeRef.current;
                if (timeSinceLastSave < minIntervalRef.current) {
                    timeoutRef.current = setTimeout(
                        runSave,
                        minIntervalRef.current - timeSinceLastSave
                    );
                    return;
                }
            }

            try {
                await saveFnRef.current();
                lastSaveTimeRef.current = Date.now();
            } catch (error) {
                onErrorRef.current?.(error);
            }
        };

        timeoutRef.current = setTimeout(runSave, delay);

        return clearTimer;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [delay, enabled, ...dependencies]);

    return { clearTimer };
}
