#!/bin/bash

# Hybrid deployment script for Fly.io
# Uses managed PostgreSQL and Redis, deploys 3 custom apps

set -e

echo "🚀 Starting hybrid deployment on Fly.io..."

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

# Create managed PostgreSQL database
setup_postgres() {
    print_status "Setting up managed PostgreSQL database..."

    # Check if database already exists
    if fly postgres list | grep -q "meta-platform-mz3"; then
        print_warning "PostgreSQL database 'meta-platform-mz3' already exists"
        return
    fi

    # Create new PostgreSQL database
    fly postgres create meta-platform-mz3 --region sea --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1

    print_success "PostgreSQL database created"
}

# Create managed Redis database
setup_redis() {
    print_status "Setting up managed Redis database..."

    # Check if Redis already exists
    if fly redis list | grep -q "meta-platform-redis"; then
        print_warning "Redis database 'meta-platform-redis' already exists"
        return
    fi

    # Create new Redis database (Upstash Redis - no plan flag needed)
    fly redis create --name meta-platform-redis --region sea

    print_success "Redis database created"
}

# Get database credentials and set secrets
setup_secrets() {
    print_status "Setting up application secrets..."

    # Get PostgreSQL credentials (from the output we saw, password is: blBnqcXPOS18cf6)
    PG_PASSWORD="blBnqcXPOS18cf6"

    # For Redis, we'll need to get the password after creation
    # For now, we'll set a placeholder and update it after Redis is created
    REDIS_PASSWORD="placeholder"

    # Set secrets for API app
    print_status "Setting secrets for API app..."
    fly secrets set \
        DB_PASSWORD="$PG_PASSWORD" \
        REDIS_PASSWORD="$REDIS_PASSWORD" \
        GEMINI_KEY="$GEMINI_KEY" \
        JWT_SECRET="$JWT_SECRET" \
        -a cursor-gemini-api

    # Set secrets for Bot app
    print_status "Setting secrets for Bot app..."
    fly secrets set \
        DB_PASSWORD="$PG_PASSWORD" \
        REDIS_PASSWORD="$REDIS_PASSWORD" \
        GEMINI_KEY="$GEMINI_KEY" \
        -a cursor-gemini-bot

    print_success "Secrets configured"
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
    setup_postgres
    setup_redis
    setup_secrets
    deploy_api
    deploy_ui
    deploy_bot
    run_migrations
    show_status
}

# Run main function
main "$@"
