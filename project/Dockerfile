FROM php:8.3-apache

# Install Node.js and npm
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install bun globally
RUN npm install -g bun

RUN apt-get update

# Install development packages
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
    libzip-dev \
    libwebp-dev \
    libjpeg62-turbo-dev \
    libxpm-dev \
    libgd-dev \
    default-mysql-client \
    lcov # Added lcov for code coverage reports

# Set apache document root
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Enable apache modules
RUN a2enmod rewrite headers

# Start with base php config, then add extensions
RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

# Install PHP extensions
RUN docker-php-ext-configure gd --with-jpeg --with-freetype --with-webp \
    && docker-php-ext-install gd

RUN docker-php-ext-install \
    bz2 \
    intl \
    iconv \
    bcmath \
    opcache \
    calendar \
    mbstring \
    pdo_mysql \
    zip \
    exif \
    pcntl

# Enable additional extensions
RUN docker-php-ext-enable \
    gd \
    bz2 \
    intl \
    iconv \
    bcmath \
    opcache \
    calendar \
    mbstring \
    pdo_mysql \
    zip \
    exif \
    pcntl

# Install Xdebug for code coverage
RUN pecl install xdebug \
    && docker-php-ext-enable xdebug

# Install ImageMagick and Imagick extension
RUN apt-get update && apt-get install -y \
    imagemagick \
    libmagickwand-dev \
    ghostscript \
    && pecl install imagick \
    && docker-php-ext-enable imagick

# Update ImageMagick security policy
RUN if [ -f /etc/ImageMagick-6/policy.xml ]; then \
        sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml; \
        sed -i 's/domain="coder" rights="none" pattern="PS"/domain="coder" rights="read|write" pattern="PS"/' /etc/ImageMagick-6/policy.xml; \
        sed -i 's/domain="coder" rights="none" pattern="EPS"/domain="coder" rights="read|write" pattern="EPS"/' /etc/ImageMagick-6/policy.xml; \
        sed -i 's/domain="coder" rights="none" pattern="XPS"/domain="coder" rights="read|write" pattern="XPS"/' /etc/ImageMagick-6/policy.xml; \
    fi \
    && if [ -f /etc/ImageMagick-7/policy.xml ]; then \
        sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-7/policy.xml; \
    fi

# Verify ImageMagick installation and configuration
RUN convert -version \
    && identify -version \
    && gs --version

# Set proper memory limits for PHP
RUN echo "memory_limit = 512M" >> /usr/local/etc/php/conf.d/docker-php-memory-limit.ini

# Install Redis extension
RUN pecl install redis \
    && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy and set up the start script
COPY ./start.sh /scripts/start.sh
WORKDIR /scripts
RUN chmod +x start.sh

# Create a user with the same UID/GID as the host user
ARG uid
RUN useradd -G www-data,root -u $uid -d /home/devuser devuser
RUN mkdir -p /home/devuser/.composer && \
    chown -R devuser:devuser /home/devuser

# Set permissions for Laravel storage and cache directories if they exist
RUN if [ -d /var/www/html/storage ]; then chown -R www-data:www-data /var/www/html/storage; fi \
    && if [ -d /var/www/html/public ]; then chown -R www-data:www-data /var/www/html/public; fi \
    && if [ -d /var/www/html/bootstrap/cache ]; then chown -R www-data:www-data /var/www/html/bootstrap/cache; fi

RUN if [ -d /var/www/html/storage ]; then chmod -R 775 /var/www/html/storage; fi \
    && if [ -d /var/www/html/public ]; then chmod -R 775 /var/www/html/public; fi \
    && if [ -d /var/www/html/bootstrap/cache ]; then chmod -R 775 /var/www/html/bootstrap/cache; fi

# Xdebug configuration for code coverage
RUN echo "xdebug.mode=coverage" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.start_with_request=yes" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# Install supervisor
RUN apt-get update && apt-get install -y supervisor

# Create supervisor directories
RUN mkdir -p /var/log/supervisor /var/run/supervisor
RUN chmod -R 777 /var/log/supervisor /var/run/supervisor

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Make sure Apache can write to necessary directories
RUN chown -R www-data:www-data /var/lock/apache2 /var/run/apache2 /var/log/apache2

ENTRYPOINT ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
