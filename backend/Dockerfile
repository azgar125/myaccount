FROM php:8.3-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    default-mysql-client \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application
COPY . .

# Prepare Laravel cache directory
RUN rm -rf bootstrap/cache/* \
    && mkdir -p bootstrap/cache \
    && echo '*' > bootstrap/cache/.gitignore \
    && echo '!.gitignore' >> bootstrap/cache/.gitignore

# Remove local .env
RUN rm -f .env

# Install PHP dependencies
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --prefer-dist

# Clean Laravel cache
RUN rm -rf bootstrap/cache/* \
    && mkdir -p bootstrap/cache \
    && echo '*' > bootstrap/cache/.gitignore \
    && echo '!.gitignore' >> bootstrap/cache/.gitignore

# Set permissions
RUN chown -R www-data:www-data \
        /var/www/html/storage \
        /var/www/html/bootstrap/cache \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache \
    && (chmod 644 /var/www/html/storage/certs/ca.pem 2>/dev/null || true)

# Runtime write permissions
RUN chmod -R 777 bootstrap/cache storage || true

# Railway uses the PORT environment variable
EXPOSE 8000

# Start Laravel
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8000} -t public"] 