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

if [ "$APP_KEY" = "CHANGE-ME" ] || [ -z "$APP_KEY" ] || ! grep -q 'APP_KEY=base64:' .env 2>/dev/null; then
    echo "Generating APP_KEY..."
    KEY=$(php -r "echo base64_encode(random_bytes(32));")
    export APP_KEY="base64:${KEY}"

    if grep -q '^APP_KEY=' .env 2>/dev/null; then
        sed -i.bak "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env
        rm -f .env.bak
    else
        echo "APP_KEY=${APP_KEY}" >> .env
    fi
fi

echo "Running migrations..."
php artisan migrate --force

echo "Starting PHP-FPM & Nginx..."
exec /usr/local/bin/start.sh
