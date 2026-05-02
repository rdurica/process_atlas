import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@/Components/ui/dialog';
import { type ReactNode } from 'react';

interface ModalProps {
    show: boolean;
    onClose: () => void;
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    closeable?: boolean;
}

const maxWidthClasses: Record<string, string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
};

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}: ModalProps) {
    return (
        <Dialog
            open={show}
            onOpenChange={open => {
                if (!open && closeable) {
                    onClose();
                }
            }}
        >
            <DialogPortal>
                <DialogOverlay />
                <DialogContent
                    className={maxWidthClasses[maxWidth]}
                    onPointerDownOutside={e => {
                        if (!closeable) {
                            e.preventDefault();
                        }
                    }}
                    onEscapeKeyDown={e => {
                        if (!closeable) {
                            e.preventDefault();
                        }
                    }}
                >
                    {children}
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
}
