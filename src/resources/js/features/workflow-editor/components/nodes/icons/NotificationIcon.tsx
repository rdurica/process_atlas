import type { ReactElement } from 'react';

export default function NotificationIcon(): ReactElement {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="16"
            height="16"
        >
            <path d="M8 16a2 2 0 004 0H8z" />
            <path
                fillRule="evenodd"
                d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"
                clipRule="evenodd"
            />
        </svg>
    );
}
