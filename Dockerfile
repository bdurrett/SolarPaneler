FROM php:8.3-cli-alpine

WORKDIR /var/www/html
COPY . .

COPY pvs_config.example.php /var/www/html/pvs_config.php

# Cache dir holds the session token and saved panel layout
RUN mkdir -p cache \
    && chown -R www-data:www-data cache \
    && chmod 775 cache

USER www-data

ENV PHP_CLI_SERVER_WORKERS=4

EXPOSE 8080
CMD ["php", "-S", "0.0.0.0:8080", "-t", "/var/www/html"]
