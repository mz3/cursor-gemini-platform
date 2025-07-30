#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found. Please copy env.example to .env and update the values."
    exit 1
fi

# Check if required environment variables are set
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "Error: TELEGRAM_BOT_TOKEN is not set in .env file"
    exit 1
fi

echo "Getting Telegram webhook info..."
echo "Bot Token: ${TELEGRAM_BOT_TOKEN:0:10}..."

# Get webhook info
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" \
  -H "Content-Type: application/json"
