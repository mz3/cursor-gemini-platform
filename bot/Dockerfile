FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

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
