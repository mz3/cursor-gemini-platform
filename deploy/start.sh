#!/bin/sh

# Start script for Fly.io deployment
# This script starts both the API and UI services

set -e

echo "Starting meta-application platform..."

# Function to handle shutdown
cleanup() {
    echo "Shutting down services..."
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
    fi
    if [ ! -z "$UI_PID" ]; then
        kill $UI_PID 2>/dev/null || true
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start API service
echo "Starting API service on port 4000..."
cd /app/api
npm run start &
API_PID=$!

# Wait a moment for API to start
sleep 2

# Start UI service
echo "Starting UI service on port 3000..."
cd /app/webapp
npm run start &
UI_PID=$!

echo "All services started. API PID: $API_PID, UI PID: $UI_PID"

# Wait for either process to exit
wait $API_PID $UI_PID

# If we get here, one of the processes has exited
echo "One of the services has stopped. Shutting down..."
cleanup
