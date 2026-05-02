import { useEffect } from 'react';
import { toast } from 'sonner';

interface ToastContainerProps {
    actionError: string | null;
    actionNotice: string | null;
}

export default function ToastContainer({ actionError, actionNotice }: ToastContainerProps) {
    useEffect(() => {
        if (actionError) {
            toast.error(actionError);
        }
    }, [actionError]);

    useEffect(() => {
        if (actionNotice) {
            toast.success(actionNotice);
        }
    }, [actionNotice]);

    return null;
}
