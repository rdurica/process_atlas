import Modal from '@/Components/Modal';
import { useEditorStore } from '../../stores/editorStore';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';

interface CreateDraftModalProps {
    createDraft: (name?: string, sourceId?: number) => Promise<void>;
}

export default function CreateDraftModal({ createDraft }: CreateDraftModalProps) {
    const draftModalOpen = useEditorStore(state => state.draftModalOpen);
    const setDraftModalOpen = useEditorStore(state => state.setDraftModalOpen);
    const draftNameInput = useEditorStore(state => state.draftNameInput);
    const setDraftNameInput = useEditorStore(state => state.setDraftNameInput);
    const draftSourceRevisionId = useEditorStore(state => state.draftSourceRevisionId);
    const isRunningAction = useEditorStore(state => state.isRunningAction);

    const handleClose = () => {
        setDraftModalOpen(false);
        setDraftNameInput('');
    };

    const handleSubmit = () => {
        void createDraft(draftNameInput || undefined, draftSourceRevisionId);
        handleClose();
    };

    return (
        <Modal show={draftModalOpen} maxWidth="md" onClose={handleClose}>
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
                    <Button type="button" variant="outline" size="sm" onClick={handleClose}>
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
