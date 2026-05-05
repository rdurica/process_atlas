import { useEffect } from 'react';
import { toast } from 'sonner';

interface FlashData {
    status?: string;
    success?: string;
    error?: string;
}

interface InertiaSuccessEventDetail {
    page: {
        props: {
            flash?: FlashData;
        };
    };
}

export default function FlashToaster() {
    useEffect(() => {
        const handleSuccess = (event: Event) => {
            const detail = (event as CustomEvent<InertiaSuccessEventDetail>).detail;
            const flash = detail?.page?.props?.flash;

            if (flash?.status) {
                toast.success(flash.status);
            }

            if (flash?.success) {
                toast.success(flash.success);
            }

            if (flash?.error) {
                toast.error(flash.error);
            }
        };

        document.addEventListener('inertia:success', handleSuccess);

        return () => {
            document.removeEventListener('inertia:success', handleSuccess);
        };
    }, []);

    return null;
}
