import { useMemo } from 'react';

interface UseEditorPermissionsOptions {
    currentUserRole: 'process_owner' | 'editor' | 'viewer' | null;
    latestRevisionIsPublished: boolean | undefined;
    latestRevisionIsLocked: boolean | undefined;
    isArchived: boolean;
    previewRevision: unknown | null;
}

export function useEditorPermissions({
    currentUserRole,
    latestRevisionIsPublished,
    latestRevisionIsLocked,
    isArchived,
    previewRevision,
}: UseEditorPermissionsOptions) {
    const canEditInProject = useMemo(
        () => currentUserRole === 'process_owner' || currentUserRole === 'editor',
        [currentUserRole]
    );

    const canPublishWorkflows = useMemo(
        () => currentUserRole === 'process_owner',
        [currentUserRole]
    );

    const canEditWorkflows = useMemo(
        () =>
            canEditInProject &&
            latestRevisionIsPublished !== true &&
            latestRevisionIsLocked !== true &&
            previewRevision === null &&
            !isArchived,
        [
            canEditInProject,
            latestRevisionIsPublished,
            latestRevisionIsLocked,
            previewRevision,
            isArchived,
        ]
    );

    return {
        canEditInProject,
        canPublishWorkflows,
        canEditWorkflows,
    };
}
