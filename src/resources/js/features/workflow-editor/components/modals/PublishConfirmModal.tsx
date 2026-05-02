import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { AlertTriangle } from 'lucide-react';

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
                    <Button type="button" variant="outline" size="sm" onClick={onClose}>
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
