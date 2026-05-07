import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
    ],
    server: {
        https: false,
        host: '0.0.0.0',
        port: 5173,
        origin: 'https://localhost',
        cors: {
            origin: ['https://localhost'],
            credentials: true,
        },
        hmr: {
            protocol: 'wss',
            host: 'localhost',
            clientPort: 443,
        },
    },
});
