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

# Set environment variables to ensure devDependencies are installed and fix rollup issues
ENV NODE_ENV=development
ENV ROLLUP_SKIP_NATIVE=true

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies since NODE_ENV=development)
RUN npm install

# Ensure Cypress binary is installed
RUN npx cypress install

# Expose port for Vite dev server
EXPOSE 3000

# Start the Vite dev server
CMD ["npm", "run", "dev"]
