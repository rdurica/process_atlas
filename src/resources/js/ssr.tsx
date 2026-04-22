import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { route } from '../../vendor/tightenco/ziggy';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer(page =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: title => `${title} - ${appName}`,
        resolve: name =>
            resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
        setup: ({ App, props }) => {
            const ssrRoute = ((name: string | undefined, params?: unknown, absolute?: boolean) => {
                if (name === undefined) {
                    return route();
                }

                return route(name, params as never, absolute, {
                    ...page.props.ziggy,
                    location: new URL(page.props.ziggy.location),
                });
            }) as typeof route;

            (globalThis as typeof globalThis & { route: typeof route }).route = ssrRoute;

            return <App {...props} />;
        },
    })
);
