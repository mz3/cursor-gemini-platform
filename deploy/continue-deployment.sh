#!/bin/bash

# Continuation script for hybrid deployment on Fly.io
# This script continues from where the previous deployment left off

set -e

echo "🚀 Continuing hybrid deployment on Fly.io..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."

    if [ -z "$GEMINI_KEY" ]; then
        print_error "GEMINI_KEY environment variable is not set"
        exit 1
    fi

    if [ -z "$JWT_SECRET" ]; then
        print_warning "JWT_SECRET not set, using default"
        export JWT_SECRET="your-jwt-secret-key-change-in-production"
    fi

    print_success "Environment variables validated"
}

# Create managed Redis database
setup_redis() {
    print_status "Setting up managed Redis database..."

    # Check if Redis already exists
    if fly redis list | grep -q "meta-platform-redis"; then
        print_warning "Redis database 'meta-platform-redis' already exists"
        return
    fi

    # Create new Redis database (Upstash Redis)
    echo "Creating Redis database..."
    fly redis create --name meta-platform-redis --region sea

    print_success "Redis database created"
}

# Get Redis credentials and update secrets
update_redis_secrets() {
    print_status "Getting Redis credentials and updating secrets..."

    # Get Redis info
    REDIS_INFO=$(fly redis list | grep "meta-platform-redis")
    print_status "Redis info: $REDIS_INFO"

    # For now, we'll use a placeholder password
    # In a real deployment, you'd get this from the Redis creation output
    REDIS_PASSWORD="your-redis-password-here"

    # Update secrets for API app
    print_status "Updating Redis secrets for API app..."
    fly secrets set REDIS_PASSWORD="$REDIS_PASSWORD" -a cursor-gemini-api

    # Update secrets for Bot app
    print_status "Updating Redis secrets for Bot app..."
    fly secrets set REDIS_PASSWORD="$REDIS_PASSWORD" -a cursor-gemini-bot

    print_success "Redis secrets updated"
}

# Deploy API app
deploy_api() {
    print_status "Deploying API app..."

    # Create app if it doesn't exist
    if ! fly apps list | grep -q "cursor-gemini-api"; then
        fly apps create cursor-gemini-api --org personal
    fi

    # Deploy with the updated configuration
    fly deploy --config deploy/fly.api.toml

    print_success "API app deployed"
}

# Deploy UI app
deploy_ui() {
    print_status "Deploying UI app..."

    # Create app if it doesn't exist
    if ! fly apps list | grep -q "cursor-gemini-webapp"; then
        fly apps create cursor-gemini-webapp --org personal
    fi

    # Deploy with the updated configuration
    fly deploy --config deploy/fly.ui.toml

    print_success "UI app deployed"
}

# Deploy Bot app
deploy_bot() {
    print_status "Deploying Bot app..."

    # Create app if it doesn't exist
    if ! fly apps list | grep -q "cursor-gemini-bot"; then
        fly apps create cursor-gemini-bot --org personal
    fi

    # Deploy with the updated configuration
    fly deploy --config deploy/fly.bot.toml

    print_success "Bot app deployed"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."

    # Connect to the API app and run migrations
    fly ssh console -a cursor-gemini-api -C "cd /app && npm run migration:run"

    print_success "Database migrations completed"
}

# Show deployment status
show_status() {
    print_status "Deployment completed! Here's the status:"
    echo ""
    echo "📊 Apps Status:"
    fly apps list
    echo ""
    echo "🌐 App URLs:"
    echo "  API: https://cursor-gemini-api.fly.dev"
    echo "  UI:  https://cursor-gemini-webapp.fly.dev"
    echo "  Bot: https://cursor-gemini-bot.fly.dev"
    echo ""
    echo "🗄️  Database Status:"
    fly postgres list
    fly redis list
    echo ""
    print_success "Hybrid deployment completed successfully!"
}

# Main deployment flow
main() {
    check_env_vars
    setup_redis
    update_redis_secrets
    deploy_api
    deploy_ui
    deploy_bot
    run_migrations
    show_status
}

# Run main function
main "$@"
