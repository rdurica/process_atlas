import { useEffect } from 'react';
import type { Edge, Node } from '@xyflow/react';
import type { GraphState } from '../types';

interface UseDirtyGraphUnloadOptions {
    graphState: GraphState;
    revisionId: string | null;
    nodes: Node[];
    edges: Edge[];
    lockVersion: number;
}

export function useDirtyGraphUnload({
    graphState,
    revisionId,
    nodes,
    edges,
    lockVersion,
}: UseDirtyGraphUnloadOptions) {
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (graphState !== 'dirty') {
                return;
            }

            event.preventDefault();
            event.returnValue = '';
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'hidden' || graphState !== 'dirty' || !revisionId) {
                return;
            }

            void fetch(`/api/v1/workflow-revisions/${revisionId}/graph`, {
                method: 'PATCH',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    graph_json: { nodes, edges },
                    lock_version: lockVersion,
                    source: 'autosave',
                }),
            });
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [edges, graphState, lockVersion, nodes, revisionId]);
}
