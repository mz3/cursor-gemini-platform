FROM node:24-alpine

WORKDIR /app

# Install Xvfb and necessary dependencies for Cypress
RUN apk add --no-cache \
    xvfb \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Ensure Cypress binary is installed
RUN npx cypress install

# Expose port for Vite dev server
EXPOSE 3000

# Start the Vite dev server
CMD ["npm", "run", "dev"]
