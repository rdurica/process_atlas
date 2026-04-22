import fs from 'node:fs';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

const certKeyPath = '/etc/nginx/certs/tls.key';
const certPath = '/etc/nginx/certs/tls.crt';
const httpsConfig = fs.existsSync(certKeyPath) && fs.existsSync(certPath)
    ? {
          key: fs.readFileSync(certKeyPath),
          cert: fs.readFileSync(certPath),
      }
    : undefined;

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
        https: httpsConfig,
        host: '0.0.0.0',
        port: 5173,
        origin: 'https://localhost:5173',
        cors: {
            origin: 'https://localhost',
            credentials: true,
        },
    },
});
