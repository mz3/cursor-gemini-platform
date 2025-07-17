FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port for Vite dev server
EXPOSE 3000

# Start the Vite dev server
CMD ["npm", "run", "dev"]
