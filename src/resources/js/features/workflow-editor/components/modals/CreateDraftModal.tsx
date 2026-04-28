import Modal from '@/Components/Modal';

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
                <h3 className="text-lg font-semibold text-slate-950">New Draft</h3>
                <p className="mt-2 text-sm text-slate-600">
                    Create a new draft to explore a different direction for this workflow.
                </p>
                <label className="mt-4 block text-sm font-medium text-slate-700">
                    Draft name (optional)
                    <input
                        value={draftNameInput}
                        onChange={event => setDraftNameInput(event.target.value)}
                        className="input-shell mt-2"
                        placeholder="e.g. Variant with approval"
                        onKeyDown={event => {
                            if (event.key === 'Enter') {
                                handleSubmit();
                            }
                        }}
                    />
                </label>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary workflow-action-button"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isRunningAction}
                        className="btn-primary workflow-action-button"
                    >
                        Create Draft
                    </button>
                </div>
            </div>
        </Modal>
    );
}
