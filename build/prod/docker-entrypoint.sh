#!/bin/bash
set -e

echo "Process Atlas — Starting..."

if [ ! -f .env ]; then
    echo "Creating .env from environment..."
    printenv | grep -E '^(APP_|DB_|REDIS_|SESSION_|CACHE_|QUEUE_|LOG_|MAIL_|SANCTUM_|VITE_|BROADCAST_|FILESYSTEM_|BCRYPT_|APP_MAINTENANCE_)' > .env
fi

wait_for() {
    local host="$1" port="$2" name="$3" max=30 i=0
    while ! nc -z "$host" "$port" 2>/dev/null; do
        i=$((i + 1))
        if [ "$i" -ge "$max" ]; then
            echo "ERROR: $name ($host:$port) not reachable after ${max}s — aborting" >&2
            exit 1
        fi
        echo "Waiting for $name ($host:$port)... ($i/$max)"
        sleep 1
    done
    echo "$name ($host:$port) is ready"
}

wait_for "${DB_HOST:-postgres}" "${DB_PORT:-5432}" "PostgreSQL"
wait_for "${REDIS_HOST:-redis}" "${REDIS_PORT:-6379}" "Redis"

if grep -q 'CHANGE-ME' .env 2>/dev/null || ! grep -q 'APP_KEY=base64:' .env 2>/dev/null; then
    echo "Generating APP_KEY..."
    php artisan key:generate --force
fi

echo "Running migrations..."
php artisan migrate --force

echo "Starting PHP-FPM & Nginx..."
exec /usr/local/bin/start.sh
