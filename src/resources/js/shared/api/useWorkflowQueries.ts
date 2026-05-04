import { useQuery, useMutation } from '@tanstack/react-query';
import { router } from '@inertiajs/react';
import { processAtlasApi } from './processAtlasApi';
import type { WorkflowRevisionSummary } from '@/types/processAtlas';

const workflowKeys = {
    all: ['workflows'] as const,
    detail: (id: number) => [...workflowKeys.all, id] as const,
    revisions: (id: number) => [...workflowKeys.detail(id), 'revisions'] as const,
};

export function useCreateRevision() {
    return useMutation({
        mutationFn: ({
            workflowId,
            draftName,
            sourceRevisionId,
        }: {
            workflowId: number;
            draftName?: string;
            sourceRevisionId?: number;
        }) =>
            processAtlasApi.workflows.createRevision(workflowId, {
                draft_name: draftName || undefined,
                source_revision_id: sourceRevisionId,
            }),
        onSuccess: () => {
            router.reload({ only: ['workflow'] });
        },
    });
}

export function usePublishRevision() {
    return useMutation({
        mutationFn: ({ revisionId, force }: { revisionId: number; force?: boolean }) =>
            processAtlasApi.revisions.publish(revisionId, force ?? false),
        onSuccess: () => {
            router.reload({ only: ['workflow'] });
        },
    });
}

export function useDeleteRevision() {
    return useMutation({
        mutationFn: (revisionId: number) => processAtlasApi.revisions.delete(revisionId),
        onSuccess: () => {
            router.reload({ only: ['workflow'] });
        },
    });
}

export function useSwitchToDraft() {
    return useMutation({
        mutationFn: (revisionId: number) => processAtlasApi.revisions.switchToDraft(revisionId),
        onSuccess: () => {
            router.reload({ only: ['workflow'] });
        },
    });
}

export function useGetRevision() {
    return useQuery({
        queryKey: workflowKeys.all,
        queryFn: () => Promise.resolve(null),
        enabled: false,
    });
}

export function usePreviewRevision(revisionId: number | null) {
    return useQuery({
        queryKey: [...workflowKeys.all, 'preview', revisionId],
        queryFn: async () => {
            if (!revisionId) return null;
            const response = await processAtlasApi.revisions.get(revisionId);
            return response.data.data as WorkflowRevisionSummary;
        },
        enabled: !!revisionId,
    });
}

export function useSaveDraftName() {
    return useMutation({
        mutationFn: ({ revisionId, draftName }: { revisionId: number; draftName: string }) =>
            processAtlasApi.revisions.saveDraftName(revisionId, draftName),
        onSuccess: () => {
            router.reload({ only: ['workflow'] });
        },
    });
}

export function useSaveGraph() {
    return useMutation({
        mutationFn: ({
            revisionId,
            graphJson,
            lockVersion,
            source,
        }: {
            revisionId: number;
            graphJson: unknown;
            lockVersion: number;
            source: 'ui' | 'autosave';
        }) =>
            processAtlasApi.revisions.saveGraph(revisionId, {
                graph_json: graphJson,
                lock_version: lockVersion,
                source,
            }),
    });
}
