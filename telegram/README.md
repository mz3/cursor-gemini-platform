# Telegram Webhook Management Scripts

This folder contains scripts to manage your Telegram bot webhook configuration.

## Setup

1. **Copy the environment file:**
   ```bash
   cp env.example .env
   ```

2. **Edit the .env file** with your actual values:
   ```bash
   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_WEBHOOK_URL=your_webhook_url_here
   ```

3. **Make scripts executable:**
   ```bash
   chmod +x *.sh
   ```

## Scripts

### `set-webhook.sh`
Sets the webhook URL for your Telegram bot.

```bash
./set-webhook.sh
```

### `get-webhook-info.sh`
Gets information about the current webhook configuration.

```bash
./get-webhook-info.sh
```

### `delete-webhook.sh`
Deletes the current webhook configuration.

```bash
./delete-webhook.sh
```

## Usage Examples

```bash
# Set webhook
./set-webhook.sh

# Check webhook status
./get-webhook-info.sh

# Delete webhook (if needed)
./delete-webhook.sh
```

## Troubleshooting

- **"Error: .env file not found"**: Make sure you've copied `env.example` to `.env`
- **"Error: TELEGRAM_BOT_TOKEN is not set"**: Check your `.env` file has the correct token
- **"Error: TELEGRAM_WEBHOOK_URL is not set"**: Check your `.env` file has the correct webhook URL

## Security Note

- Keep your `.env` file secure and never commit it to version control
- The `.env` file is already in `.gitignore` to prevent accidental commits
