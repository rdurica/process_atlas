import Modal from '@/Components/Modal';

interface PublishConfirmModalProps {
    open: boolean;
    onClose: () => void;
    publishConfirmInput: string;
    setPublishConfirmInput: (input: string) => void;
    publishCurrent: (force?: boolean) => Promise<void>;
    isRunningAction: boolean;
}

export default function PublishConfirmModal({
    open,
    onClose,
    publishConfirmInput,
    setPublishConfirmInput,
    publishCurrent,
    isRunningAction,
}: PublishConfirmModalProps) {
    const handlePublish = () => {
        void publishCurrent(true);
        onClose();
    };

    return (
        <Modal show={open} maxWidth="md" onClose={onClose}>
            <div className="p-6">
                <div className="flex justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-14 w-14 text-red-600"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        />
                    </svg>
                </div>
                <h3 className="mt-4 text-center text-lg font-semibold text-red-600">
                    Publish draft from a different revision?
                </h3>
                <p className="mt-3 text-sm text-slate-600">
                    This draft was not created from the currently published revision. Publishing it
                    will overwrite the live version with this draft. Please confirm that you are
                    doing this deliberately.
                </p>
                <div className="mt-4">
                    <label
                        htmlFor="publish-confirm-input"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Type &quot;I agree&quot; to confirm
                    </label>
                    <input
                        id="publish-confirm-input"
                        type="text"
                        value={publishConfirmInput}
                        onChange={e => setPublishConfirmInput(e.target.value)}
                        className="input-shell mt-2"
                        placeholder="I agree"
                        autoFocus
                    />
                </div>
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
                        onClick={handlePublish}
                        disabled={isRunningAction || publishConfirmInput.trim() !== 'I agree'}
                        className="btn-danger workflow-action-button"
                    >
                        Publish
                    </button>
                </div>
            </div>
        </Modal>
    );
}
