import Modal from '@/Components/Modal';

interface PreviewImageModalProps {
    previewImageUrl: string | null;
    onClose: () => void;
}

export default function PreviewImageModal({ previewImageUrl, onClose }: PreviewImageModalProps) {
    return (
        <Modal show={previewImageUrl !== null} maxWidth="2xl" onClose={onClose}>
            {previewImageUrl && (
                <div className="overflow-hidden">
                    <div className="flex items-center justify-center border-b px-4 py-3">
                        <span className="text-sm font-semibold text-foreground">
                            Screen Preview
                        </span>
                    </div>
                    <img
                        src={previewImageUrl}
                        alt="Screen preview"
                        className="block max-h-[80vh] w-full bg-muted object-contain"
                    />
                </div>
            )}
        </Modal>
    );
}
