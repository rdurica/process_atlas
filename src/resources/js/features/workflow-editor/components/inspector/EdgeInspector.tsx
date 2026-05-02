import { isConditionNodeKind } from '../../lib/utils';
import type { EdgeInspectorProps } from './types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';

export default function EdgeInspector({
    selectedEdge,
    selectedEdgeSourceNode,
    canEditWorkflows,
    edgeDraftLabel,
    setEdgeDraftLabel,
    saveSelectedEdgeLabel,
    removeSelectedEdge,
}: EdgeInspectorProps) {
    return (
        <form onSubmit={saveSelectedEdgeLabel} className="mt-5 flex flex-1 flex-col gap-4">
            <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm font-semibold text-foreground">
                    {selectedEdge.source} to {selectedEdge.target}
                </p>
                <p className="text-xs text-muted-foreground">
                    {isConditionNodeKind(selectedEdgeSourceNode?.type)
                        ? 'Condition branch'
                        : 'Connection'}
                </p>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="edge-label">Label</Label>
                <Input
                    id="edge-label"
                    value={edgeDraftLabel}
                    onChange={event => setEdgeDraftLabel(event.target.value)}
                    disabled={!canEditWorkflows}
                />
            </div>

            <div className="mt-auto flex justify-end gap-2">
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeSelectedEdge}
                    disabled={!canEditWorkflows}
                >
                    Delete
                </Button>
                <Button type="submit" size="sm" disabled={!canEditWorkflows}>
                    Save Label
                </Button>
            </div>
        </form>
    );
}
