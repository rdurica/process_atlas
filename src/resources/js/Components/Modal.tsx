import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@/Components/ui/dialog';
import { type ReactNode } from 'react';

interface ModalProps {
    show: boolean;
    onClose: () => void;
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
    closeable?: boolean;
}

const maxWidthClasses: Record<string, string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
    full: 'sm:max-w-[95vw]',
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
