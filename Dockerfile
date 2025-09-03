# Construction Template Deployment Container
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p dist logs

# Set up permissions
RUN chown -R node:node /app
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node scripts/test-connection.js health || exit 1

# Expose port (if needed for web interface)
EXPOSE 3000

# Default command
CMD ["npm", "start"]

# Labels for Docker Hub and container management
LABEL maintainer="John Pugh <john@example.com>"
LABEL version="1.0.0"
LABEL description="Construction project management Notion template deployment system"
LABEL org.opencontainers.image.title="Construction Template API"
LABEL org.opencontainers.image.description="Professional construction project management templates for Notion"
LABEL org.opencontainers.image.vendor="Construction Templates Inc"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.created="2025-01-03"
LABEL org.opencontainers.image.source="https://github.com/username/const-pm-notion"