interface ToastContainerProps {
    actionError: string | null;
    actionNotice: string | null;
}

export default function ToastContainer({ actionError, actionNotice }: ToastContainerProps) {
    if (!actionError && !actionNotice) return null;

    return (
        <div
            className={`workflow-toast ${
                actionError ? 'workflow-toast-error' : 'workflow-toast-notice'
            }`.trim()}
        >
            {actionError || actionNotice}
        </div>
    );
}
