FROM php:8.3-apache

# Install Node.js and npm
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install bun globally
RUN npm install -g bun

RUN apt-get update

# 1. development packages
RUN apt-get install -y \
    nano \
    git \
    zip \
    curl \
    sudo \
    unzip \
    libicu-dev \
    libbz2-dev \
    libpng-dev \
    libjpeg-dev \
    libmcrypt-dev \
    libreadline-dev \
    libfreetype6-dev \
    g++ \
    libonig-dev \
    libzip-dev

# 2. apache configs + document root
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 3. mod_rewrite for URL rewrite and mod_headers for .htaccess extra headers like Access-Control-Allow-Origin-
RUN a2enmod rewrite headers

# 4. start with base php config, then add extensions
RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

RUN docker-php-ext-install \
    bz2 \
    intl \
    iconv \
    bcmath \
    opcache \
    calendar \
    mbstring \
    pdo_mysql \
    zip

# Enable additional extensions
RUN docker-php-ext-enable \
    bz2 \
    intl \
    iconv \
    bcmath \
    opcache \
    calendar \
    mbstring \
    pdo_mysql \
    zip

# Install Redis extension
RUN pecl install redis \
    && docker-php-ext-enable redis

# 5. composer install
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 6. Copy and set up the start script
COPY ./start.sh /scripts/start.sh
WORKDIR /scripts
RUN chmod +x start.sh

# 7. we need a user with the same UID/GID with host user
# so when we execute CLI commands, all the host file's ownership remains intact
# otherwise command from inside container will create root-owned files and directories
ARG uid
RUN useradd -G www-data,root -u $uid -d /home/devuser devuser
RUN mkdir -p /home/devuser/.composer && \
    chown -R devuser:devuser /home/devuser

# Set correct permissions for Laravel storage and cache directories
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 8. Set the entrypoint to the start script
ENTRYPOINT ["/scripts/start.sh"]
