FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Expose port
EXPOSE 3000

# Start the application in development mode with proxy support
CMD ["npm", "start"]
