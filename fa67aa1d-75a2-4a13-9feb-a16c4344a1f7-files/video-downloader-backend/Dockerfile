# Use Node.js 18 LTS as base image
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    && pip3 install --no-cache-dir yt-dlp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S videodownloader -u 1001

# Create necessary directories
RUN mkdir -p temp/downloads temp/processing temp/uploads logs && \
    chown -R videodownloader:nodejs /app

# Copy application code
COPY --chown=videodownloader:nodejs src/ ./src/

# Switch to non-root user
USER videodownloader

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/server.js"]

# Multi-stage build for development
FROM base AS development

# Switch back to root to install dev dependencies
USER root

# Install development dependencies
RUN npm ci && npm cache clean --force

# Install additional development tools
RUN apk add --no-cache git

# Switch back to app user
USER videodownloader

# Start with nodemon for development
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Copy production files only
ENV NODE_ENV=production

# Final command
CMD ["node", "src/server.js"]