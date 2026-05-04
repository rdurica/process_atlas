import { useEffect } from 'react';
import { toast } from 'sonner';
import { useEditorStore } from '../stores/editorStore';

export default function ToastContainer() {
    const actionError = useEditorStore(state => state.actionError);
    const actionNotice = useEditorStore(state => state.actionNotice);

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
