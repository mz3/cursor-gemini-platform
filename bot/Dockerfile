FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S botworker -u 1001

# Change ownership of the app directory
RUN chown -R botworker:nodejs /app
USER botworker

# Expose port (if needed for health checks)
EXPOSE 3001

# Start the bot worker
CMD ["npm", "start"]
