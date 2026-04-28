import Modal from '@/Components/Modal';

interface PreviewImageModalProps {
    previewImageUrl: string | null;
    onClose: () => void;
}

export default function PreviewImageModal({ previewImageUrl, onClose }: PreviewImageModalProps) {
    return (
        <Modal show={previewImageUrl !== null} maxWidth="2xl" onClose={onClose}>
            {previewImageUrl && (
                <div className="screen-preview-modal">
                    <div className="screen-preview-modal-header">
                        <span className="screen-preview-modal-title">Screen Preview</span>
                        <button
                            type="button"
                            className="screen-preview-modal-close"
                            onClick={onClose}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                style={{ width: '1rem', height: '1rem' }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                            Close
                        </button>
                    </div>
                    <img
                        src={previewImageUrl}
                        alt="Screen preview"
                        className="screen-preview-modal-image"
                    />
                </div>
            )}
        </Modal>
    );
}
