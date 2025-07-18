FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Expose port
EXPOSE 4000

# Start the application in dev mode with ts-node-dev
CMD ["npm", "run", "dev"]
