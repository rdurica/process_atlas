import Modal from '@/Components/Modal';
import { useEditorStore } from '../../stores/editorStore';

export default function PreviewImageModal() {
    const previewImageUrl = useEditorStore(state => state.previewImageUrl);
    const setPreviewImageUrl = useEditorStore(state => state.setPreviewImageUrl);

    const handleClose = () => setPreviewImageUrl(null);

    return (
        <Modal show={previewImageUrl !== null} maxWidth="2xl" onClose={handleClose}>
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
