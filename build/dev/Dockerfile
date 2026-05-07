FROM dunglas/frankenphp:1-php8.5-alpine

ENV TERM=xterm-256color
ENV TZ=Europe/Prague

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# System deps
RUN apk add --no-cache \
    nodejs npm bash curl git openssh-client \
    linux-headers libpq-dev libzip-dev zlib-dev \
    libxml2-dev icu-dev freetype-dev \
    libjpeg-turbo-dev libpng-dev

# PHP extensions (včetně xdebug pro dev)
RUN install-php-extensions \
    pdo pdo_mysql mysqli pdo_pgsql pgsql \
    zip intl bcmath gd sockets xdebug

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app/src

RUN adduser -D -u 1000 -s /bin/sh robbyte \
    && chown -R robbyte:robbyte /data /config

# Aliasy pro robbyte
RUN echo 'alias ll="ls -lah"' >> /home/robbyte/.bashrc && \
    echo 'alias c="composer"' >> /home/robbyte/.bashrc && \
    echo "PS1='\e[92m\u\e[0m@\e[94m\h\e[0m:\e[35m\w\e[0m# '" >> /home/robbyte/.bashrc

USER robbyte

EXPOSE 80 443
COPY --chown=robbyte:robbyte build/dev/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
CMD ["/usr/local/bin/entrypoint.sh"]
