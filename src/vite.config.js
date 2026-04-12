import fs from 'node:fs';
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
        https: {
            key: fs.readFileSync('/etc/nginx/certs/tls.key'),
            cert: fs.readFileSync('/etc/nginx/certs/tls.crt'),
        },
        host: '0.0.0.0',
        port: 5173,
        origin: 'https://localhost:5173',
        cors: {
            origin: 'https://localhost',
            credentials: true,
        },
    },
});
