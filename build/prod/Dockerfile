FROM dunglas/frankenphp:1-php8.5-alpine AS base

ENV TERM=xterm-256color
ENV TZ=Europe/Prague
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apk add --no-cache \
    bash \
    curl \
    netcat-openbsd \
    libpq-dev \
    libzip-dev \
    zlib-dev \
    libxml2-dev \
    icu-dev \
    linux-headers \
    libjpeg-turbo-dev \
    libpng-dev \
    libwebp-dev

RUN install-php-extensions \
    pdo pdo_mysql mysqli pdo_pgsql pgsql \
    zip intl bcmath gd sockets

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app/src

FROM base AS vendor

ENV APP_ENV=prod
ENV APP_DEBUG=0

COPY src/composer.json src/composer.lock ./
RUN composer install --no-dev --prefer-dist --no-progress --no-scripts --no-interaction --no-autoloader

COPY src .
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev --no-scripts

FROM node:22-alpine AS frontend

WORKDIR /app/src

COPY src/package.json src/package-lock.json ./
RUN npm ci

COPY --from=vendor /app/src/vendor/tightenco ./vendor/tightenco
COPY src/resources ./resources
COPY src/public ./public
COPY src/vite.config.js src/tsconfig.json src/tailwind.config.js src/postcss.config.js ./
RUN npm run build

FROM base AS runtime

ENV APP_ENV=prod
ENV APP_DEBUG=0

RUN adduser -D -u 1000 -s /bin/sh robbyte \
    && chown -R robbyte:robbyte /data /config

COPY build/prod/Caddyfile /etc/caddy/Caddyfile
COPY build/prod/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Enable PHP production settings
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    echo 'alias ll="ls -lah"' >> /home/robbyte/.bashrc && \
    echo 'alias c="composer"' >> /home/robbyte/.bashrc && \
    echo "PS1='\e[92m\u\e[0m@\e[94m\h\e[0m:\e[35m\w\e[0m# '" >> /home/robbyte/.bashrc

WORKDIR /app/src
COPY --from=vendor /app/src /app/src
COPY --from=frontend /app/src/public/build /app/src/public/build
COPY --from=frontend /app/src/bootstrap/ssr /app/src/bootstrap/ssr

RUN chown -R robbyte:robbyte /app/src
USER robbyte

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/up || exit 1

CMD ["/usr/local/bin/docker-entrypoint.sh"]
