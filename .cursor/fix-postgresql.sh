#!/bin/bash

echo "=== PostgreSQL Fix Script ==="

# Check if PostgreSQL data directory exists and is not empty
if [ -d "/var/lib/postgresql/17/main" ] && [ "$(ls -A /var/lib/postgresql/17/main)" ]; then
    echo "📁 PostgreSQL data directory exists and is not empty"
    echo "🔄 Attempting to start existing PostgreSQL instance..."

    # Try to start PostgreSQL
    if sudo -u postgres /usr/lib/postgresql/17/bin/pg_ctl -D /var/lib/postgresql/17/main -l /var/log/postgresql/postgresql-17-main.log start; then
        echo "✅ PostgreSQL started successfully"
    else
        echo "❌ Failed to start PostgreSQL. Checking logs..."
        echo "📋 PostgreSQL logs:"
        tail -n 20 /var/log/postgresql/postgresql-17-main.log 2>/dev/null || echo "No log file found"

        echo "🔄 Attempting to restart PostgreSQL..."
        sudo -u postgres /usr/lib/postgresql/17/bin/pg_ctl -D /var/lib/postgresql/17/main -l /var/log/postgresql/postgresql-17-main.log restart
    fi
else
    echo "📁 PostgreSQL data directory is empty or doesn't exist"
    echo "🔄 Initializing new PostgreSQL instance..."

    # Remove empty directory if it exists
    if [ -d "/var/lib/postgresql/17/main" ]; then
        echo "🗑️  Removing empty PostgreSQL data directory..."
        sudo rm -rf /var/lib/postgresql/17/main
    fi

    # Initialize PostgreSQL
    if sudo -u postgres /usr/lib/postgresql/17/bin/initdb -D /var/lib/postgresql/17/main --auth=trust; then
        echo "✅ PostgreSQL initialized successfully"

        # Start PostgreSQL
        if sudo -u postgres /usr/lib/postgresql/17/bin/pg_ctl -D /var/lib/postgresql/17/main -l /var/log/postgresql/postgresql-17-main.log start; then
            echo "✅ PostgreSQL started successfully"
        else
            echo "❌ Failed to start PostgreSQL after initialization"
        fi
    else
        echo "❌ Failed to initialize PostgreSQL"
    fi
fi

# Check if PostgreSQL is running
if pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "✅ PostgreSQL is running and ready"

    # Create user and database
    echo "👤 Creating platform_user..."
    sudo -u postgres psql -c "CREATE USER platform_user WITH PASSWORD 'platform_password';" 2>/dev/null || echo "User already exists"

    echo "🗄️  Creating platform_db..."
    sudo -u postgres psql -c "CREATE DATABASE platform_db OWNER platform_user;" 2>/dev/null || echo "Database already exists"

    echo "✅ Database setup complete"
else
    echo "❌ PostgreSQL is not running"
    echo "📋 PostgreSQL logs:"
    tail -n 20 /var/log/postgresql/postgresql-17-main.log 2>/dev/null || echo "No log file found"
fi

echo "=== PostgreSQL Fix Complete ==="
