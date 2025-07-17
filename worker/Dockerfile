FROM node:18-alpine

# Install Docker CLI
RUN apk add --no-cache docker-cli

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Start the worker in dev mode with ts-node-dev
CMD ["npm", "run", "dev"]
