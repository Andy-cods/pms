# BC Agency PMS - Nginx Docker Image
# Production-ready nginx with custom error pages

FROM nginx:1.25-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create cache directory
RUN mkdir -p /var/cache/nginx

# Create directory for certbot challenges
RUN mkdir -p /var/www/certbot

# Copy custom error pages
COPY error-pages/ /usr/share/nginx/html/

# Copy nginx configuration (can be overridden by volume mount)
COPY nginx.prod.conf /etc/nginx/nginx.conf

# Set proper permissions
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Run as non-root user for security
# Note: Commented out because binding to ports 80/443 requires root
# USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
