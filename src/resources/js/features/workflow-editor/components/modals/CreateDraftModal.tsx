import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';

interface CreateDraftModalProps {
    open: boolean;
    onClose: () => void;
    draftNameInput: string;
    setDraftNameInput: (name: string) => void;
    draftSourceRevisionId: number | undefined;
    createDraft: (name?: string, sourceId?: number) => Promise<void>;
    isRunningAction: boolean;
}

export default function CreateDraftModal({
    open,
    onClose,
    draftNameInput,
    setDraftNameInput,
    draftSourceRevisionId,
    createDraft,
    isRunningAction,
}: CreateDraftModalProps) {
    const handleSubmit = () => {
        void createDraft(draftNameInput || undefined, draftSourceRevisionId);
        onClose();
    };

    return (
        <Modal show={open} maxWidth="md" onClose={onClose}>
            <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground">New Draft</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Create a new draft to explore a different direction for this workflow.
                </p>
                <div className="mt-4 space-y-1.5">
                    <Label htmlFor="draft-name">Draft name (optional)</Label>
                    <Input
                        id="draft-name"
                        value={draftNameInput}
                        onChange={event => setDraftNameInput(event.target.value)}
                        placeholder="e.g. Variant with approval"
                        onKeyDown={event => {
                            if (event.key === 'Enter') {
                                handleSubmit();
                            }
                        }}
                    />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isRunningAction}
                    >
                        Create Draft
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
