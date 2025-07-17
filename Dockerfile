# Multi-stage Dockerfile for Fly.io deployment
FROM node:24-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files for API and UI
COPY platform-api/package*.json ./platform-api/
COPY platform-ui/package*.json ./platform-ui/

# Install dependencies for API (production only)
RUN cd platform-api && npm install --omit=dev

# Build stage for UI (with devDependencies)
FROM node:24-alpine AS ui-builder
WORKDIR /app

# Copy UI source and package files
COPY platform-ui/ ./platform-ui/
COPY platform-ui/package*.json ./platform-ui/

# Install all dependencies (including devDependencies) for UI
WORKDIR /app/platform-ui
RUN npm install

# Build UI
RUN npm run build

# Production stage
FROM node:24-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built UI
COPY --from=ui-builder --chown=nodejs:nodejs /app/platform-ui/dist ./platform-ui/build

# Copy API source
COPY --chown=nodejs:nodejs platform-api/ ./platform-api/
COPY --from=base --chown=nodejs:nodejs /app/platform-api/node_modules ./platform-api/node_modules
COPY --from=base --chown=nodejs:nodejs /app/platform-api/package*.json ./platform-api/

# Copy package files for UI (for runtime, if needed)
COPY --chown=nodejs:nodejs platform-ui/package*.json ./platform-ui/

# Create necessary directories
RUN mkdir -p /app/generated-apps && \
    chown -R nodejs:nodejs /app/generated-apps

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start script
COPY --chown=nodejs:nodejs start.sh ./
RUN chmod +x start.sh

ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
