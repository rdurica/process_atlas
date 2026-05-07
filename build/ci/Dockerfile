FROM dunglas/frankenphp:1-php8.5-alpine

ENV TERM=xterm-256color
ENV TZ=Europe/Prague
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apk add --no-cache \
    bash \
    curl \
    git \
    libpq-dev \
    libzip-dev \
    zlib-dev \
    libxml2-dev \
    icu-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libwebp-dev

RUN install-php-extensions \
    pdo pdo_mysql mysqli pdo_pgsql pgsql \
    zip intl bcmath gd sockets

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app/src
COPY src .

RUN composer install --prefer-dist --no-progress --no-interaction
RUN composer dump-autoload --optimize

RUN adduser -D -u 1000 -s /bin/sh robbyte \
    && chown -R robbyte:robbyte /app/src /data /config
USER robbyte

CMD ["php", "artisan", "test"]
