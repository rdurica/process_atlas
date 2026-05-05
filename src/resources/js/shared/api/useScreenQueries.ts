import { useMutation } from '@tanstack/react-query';
import { processAtlasApi } from './processAtlasApi';

export function useUpsertScreen() {
    return useMutation({
        mutationFn: (form: FormData) => processAtlasApi.screens.upsert(form),
    });
}

export function useUpsertCustomField() {
    return useMutation({
        mutationFn: ({
            screenId,
            payload,
        }: {
            screenId: string;
            payload: Record<string, unknown>;
        }) => processAtlasApi.screens.upsertCustomField(screenId, payload),
    });
}

export function useDeleteCustomField() {
    return useMutation({
        mutationFn: (fieldId: string) => processAtlasApi.screens.deleteCustomField(fieldId),
    });
}
