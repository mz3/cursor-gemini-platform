#!/bin/bash

# Fly.io Deployment Script for Meta-Application Platform (API + UI)

set -e

echo "🚀 Starting Fly.io deployment for cursor-gemini-platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    print_error "Fly CLI is not installed. Please install it first:"
    echo "  macOS: brew install flyctl"
    echo "  Windows: powershell -Command \"iwr https://fly.io/install.ps1 -useb | iex\""
    echo "  Linux: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is authenticated
if ! fly auth whoami &> /dev/null; then
    print_error "Not authenticated with Fly.io. Please run: fly auth login"
    exit 1
fi

# Create API app
print_status "Checking if API app exists..."
if ! fly apps list | grep -q "cursor-gemini-api"; then
    print_warning "API app 'cursor-gemini-api' does not exist. Creating..."
    fly apps create cursor-gemini-api
else
    print_status "API app 'cursor-gemini-api' already exists."
fi

# Create UI app
print_status "Checking if UI app exists..."
if ! fly apps list | grep -q "cursor-gemini-webapp"; then
    print_warning "UI app 'cursor-gemini-webapp' does not exist. Creating..."
    fly apps create cursor-gemini-webapp
else
    print_status "UI app 'cursor-gemini-webapp' already exists."
fi

# Check if database exists
print_status "Checking database..."
if ! fly postgres list | grep -q "cursor-gemini-platform-db"; then
    print_warning "Database 'cursor-gemini-platform-db' does not exist. Creating..."
    fly postgres create --name cursor-gemini-platform-db --region sea
    print_status "Database created. Please note the connection details above."
    print_warning "You may need to update the fly.toml with the correct database credentials."
else
    print_status "Database 'cursor-gemini-platform-db' already exists."
fi

# Check if Redis exists
print_status "Checking Redis..."
if ! fly redis list | grep -q "cursor-gemini-platform-redis"; then
    print_warning "Redis 'cursor-gemini-platform-redis' does not exist. Creating..."
    fly redis create --name cursor-gemini-platform-redis --region sea
    print_status "Redis created. Please note the connection details above."
    print_warning "You may need to update the fly.toml with the correct Redis credentials."
else
    print_status "Redis 'cursor-gemini-platform-redis' already exists."
fi

# Attach database to API app
print_status "Attaching database to API app..."
if ! fly postgres attach cursor-gemini-platform-db --app cursor-gemini-api --force 2>/dev/null; then
    print_warning "Database may already be attached or there was an issue. Continuing..."
fi

# Attach Redis to API app
print_status "Attaching Redis to API app..."
if ! fly redis attach cursor-gemini-platform-redis --app cursor-gemini-api --force 2>/dev/null; then
    print_warning "Redis may already be attached or there was an issue. Continuing..."
fi

# Deploy API application
print_status "Deploying API application..."
fly deploy --config fly.api.toml

# Deploy UI application
print_status "Deploying UI application..."
fly deploy --config fly.ui.toml

# Check deployment status
print_status "Checking deployment status..."
sleep 10

if fly status --app cursor-gemini-api | grep -q "running" && fly status --app cursor-gemini-webapp | grep -q "running"; then
    print_status "✅ Deployment successful!"
    print_status "Your API is available at: https://cursor-gemini-api.fly.dev"
    print_status "Your UI is available at: https://cursor-gemini-webapp.fly.dev"

    # Show app status
    echo ""
    print_status "API Status:"
    fly status --app cursor-gemini-api

    echo ""
    print_status "UI Status:"
    fly status --app cursor-gemini-webapp

    # Show recent logs
    echo ""
    print_status "Recent API logs:"
    fly logs --app cursor-gemini-api --tail 10

    echo ""
    print_status "Recent UI logs:"
    fly logs --app cursor-gemini-webapp --tail 10

else
    print_error "❌ Deployment failed or apps are not running properly."
    print_status "Checking logs for errors:"
    fly logs --app cursor-gemini-api --tail 20
    fly logs --app cursor-gemini-webapp --tail 20
    exit 1
fi

print_status "🎉 Deployment completed successfully!"
print_status "Next steps:"
echo "  1. Update environment variables in fly.toml if needed"
echo "  2. Set secrets: fly secrets set JWT_SECRET='your-secret' --app cursor-gemini-api"
echo "  3. Monitor your apps: fly dashboard"
echo "  4. View logs: fly logs --follow --app cursor-gemini-api"
echo "  5. View logs: fly logs --follow --app cursor-gemini-webapp"
