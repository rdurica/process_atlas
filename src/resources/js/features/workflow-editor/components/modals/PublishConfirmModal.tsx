import Modal from '@/Components/Modal';
import { useEditorStore } from '../../stores/editorStore';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface PublishConfirmModalProps {
    publishCurrent: (force?: boolean) => Promise<void>;
}

export default function PublishConfirmModal({ publishCurrent }: PublishConfirmModalProps) {
    const publishConfirmOpen = useEditorStore(state => state.publishConfirmOpen);
    const setPublishConfirmOpen = useEditorStore(state => state.setPublishConfirmOpen);
    const publishConfirmInput = useEditorStore(state => state.publishConfirmInput);
    const setPublishConfirmInput = useEditorStore(state => state.setPublishConfirmInput);
    const isRunningAction = useEditorStore(state => state.isRunningAction);

    const handleClose = () => {
        setPublishConfirmOpen(false);
        setPublishConfirmInput('');
    };

    const handlePublish = () => {
        void publishCurrent(true);
        handleClose();
    };

    return (
        <Modal show={publishConfirmOpen} maxWidth="md" onClose={handleClose}>
            <div className="p-6">
                <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-7 w-7 text-destructive" />
                    </div>
                </div>
                <h3 className="mt-4 text-center text-lg font-semibold text-destructive">
                    Publish draft from a different revision?
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">
                    This draft was not created from the currently published revision. Publishing it
                    will overwrite the live version with this draft. Please confirm that you are
                    doing this deliberately.
                </p>
                <div className="mt-4 space-y-1.5">
                    <Label htmlFor="publish-confirm-input">
                        Type &quot;I agree&quot; to confirm
                    </Label>
                    <Input
                        id="publish-confirm-input"
                        type="text"
                        value={publishConfirmInput}
                        onChange={e => setPublishConfirmInput(e.target.value)}
                        placeholder="I agree"
                        autoFocus
                    />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handlePublish}
                        disabled={isRunningAction || publishConfirmInput.trim() !== 'I agree'}
                    >
                        Publish
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
