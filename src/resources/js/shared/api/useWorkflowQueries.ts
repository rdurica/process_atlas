import { useQuery, useMutation } from '@tanstack/react-query';
import { router } from '@inertiajs/react';
import { processAtlasApi } from './processAtlasApi';
import type { WorkflowRevisionSummary } from '@/types/processAtlas';

const workflowKeys = {
    all: ['workflows'] as const,
    detail: (id: string) => [...workflowKeys.all, id] as const,
    revisions: (id: string) => [...workflowKeys.detail(id), 'revisions'] as const,
};

export function useCreateRevision() {
    return useMutation({
        mutationFn: ({
            workflowId,
            draftName,
            sourceRevisionId,
        }: {
            workflowId: string;
            draftName?: string;
            sourceRevisionId?: string;
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
        mutationFn: ({ revisionId, force }: { revisionId: string; force?: boolean }) =>
            processAtlasApi.revisions.publish(revisionId, force ?? false),
        onSuccess: () => {
            router.reload({ only: ['workflow'] });
        },
    });
}

export function useDeleteRevision() {
    return useMutation({
        mutationFn: (revisionId: string) => processAtlasApi.revisions.delete(revisionId),
        onSuccess: () => {
            router.reload({ only: ['workflow'] });
        },
    });
}

export function useSwitchToDraft() {
    return useMutation({
        mutationFn: (revisionId: string) => processAtlasApi.revisions.switchToDraft(revisionId),
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

export function usePreviewRevision(revisionId: string | null) {
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
        mutationFn: ({ revisionId, draftName }: { revisionId: string; draftName: string }) =>
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
            revisionId: string;
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
