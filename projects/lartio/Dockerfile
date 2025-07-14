FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    supervisor \
    mysql-client \
    nodejs \
    npm \
    bash

# Install Bun via npm (if enabled)
RUN if [ "false" = "true" ]; then \
        npm install -g bun; \
    fi

# Install pnpm (if enabled)
RUN if [ "false" = "true" ]; then \
        npm install -g pnpm; \
    fi

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip

# Install Redis extension
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create application user
RUN addgroup -g 1000 www && \
    adduser -u 1000 -G www -s /bin/sh -D www

# Set working directory
WORKDIR /var/www/html

# Create supervisor log directory
RUN mkdir -p /var/log/supervisor

# Copy supervisor configuration
COPY docker/supervisor.conf /etc/supervisor/conf.d/laravel.conf

# Copy PHP configuration if it exists
RUN if [ -f docker/php.ini ]; then \
        cp docker/php.ini /usr/local/etc/php/conf.d/custom.ini; \
    fi

# Copy application files from src directory (Laravel should already be installed)
COPY --chown=www:www src/ /var/www/html/

# Ensure Laravel directories exist and have proper permissions
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views \
    && mkdir -p bootstrap/cache \
    && chown -R www:www /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# Install/update composer dependencies if composer.json exists
RUN if [ -f composer.json ]; then \
        if [ -d vendor ]; then \
            echo "Vendor directory exists, running composer install..."; \
            composer install --no-dev --optimize-autoloader --no-interaction; \
        else \
            echo "No vendor directory, installing dependencies..."; \
            composer install --no-dev --optimize-autoloader --no-interaction; \
        fi \
    fi

# Generate Laravel application key if artisan exists and no key is set
RUN if [ -f artisan ]; then \
        if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then \
            php artisan key:generate --no-interaction --force; \
        fi \
    fi

# Install frontend dependencies and build assets if package.json exists
RUN if [ -f package.json ]; then \
        if [ "false" = "true" ] && command -v bun >/dev/null 2>&1; then \
            bun install && bun run build; \
        elif [ "false" = "true" ] && command -v pnpm >/dev/null 2>&1; then \
            pnpm install && pnpm run build; \
        else \
            npm install && npm run build; \
        fi \
    fi

# Create storage symlink if it doesn't exist
RUN if [ -f artisan ] && [ ! -L public/storage ]; then \
        php artisan storage:link; \
    fi

# Set final permissions
RUN chown -R www:www /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# Create supervisord main config
RUN echo '[unix_http_server]' > /etc/supervisord.conf && \
    echo 'file=/var/run/supervisor.sock' >> /etc/supervisord.conf && \
    echo 'chmod=0700' >> /etc/supervisord.conf && \
    echo '' >> /etc/supervisord.conf && \
    echo '[supervisord]' >> /etc/supervisord.conf && \
    echo 'logfile=/var/log/supervisor/supervisord.log' >> /etc/supervisord.conf && \
    echo 'pidfile=/var/run/supervisord.pid' >> /etc/supervisord.conf && \
    echo 'childlogdir=/var/log/supervisor' >> /etc/supervisord.conf && \
    echo 'nodaemon=true' >> /etc/supervisord.conf && \
    echo 'user=root' >> /etc/supervisord.conf && \
    echo 'silent=false' >> /etc/supervisord.conf && \
    echo 'loglevel=info' >> /etc/supervisord.conf && \
    echo '' >> /etc/supervisord.conf && \
    echo '[rpcinterface:supervisor]' >> /etc/supervisord.conf && \
    echo 'supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface' >> /etc/supervisord.conf && \
    echo '' >> /etc/supervisord.conf && \
    echo '[supervisorctl]' >> /etc/supervisord.conf && \
    echo 'serverurl=unix:///var/run/supervisor.sock' >> /etc/supervisord.conf && \
    echo '' >> /etc/supervisord.conf && \
    echo '[include]' >> /etc/supervisord.conf && \
    echo 'files = /etc/supervisor/conf.d/*.conf' >> /etc/supervisord.conf

# Expose port
EXPOSE 9000

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
