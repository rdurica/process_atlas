import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import '@fontsource/geist-mono/400.css';
import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { AppProviders } from './AppProviders';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: title => `${title} - ${appName}`,
    resolve: name =>
        resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
    setup({ el, App, props }) {
        const app = (
            <AppProviders>
                <App {...props} />
            </AppProviders>
        );

        if (el.hasChildNodes()) {
            hydrateRoot(el, app);
            return;
        }

        createRoot(el).render(app);
    },
    progress: {
        color: '#4f46e5',
    },
});
