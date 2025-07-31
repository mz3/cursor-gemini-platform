#!/bin/bash

echo "=== Background Agent Troubleshooting Script ==="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in workspace root. Please run this from the project root."
    exit 1
fi

echo "✅ In workspace root"

# Check Node.js installation
if command -v node &> /dev/null; then
    echo "✅ Node.js is installed: $(node --version)"
else
    echo "❌ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check PostgreSQL
echo "=== PostgreSQL Status ==="
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client is installed"
else
    echo "❌ PostgreSQL not found. Installing..."
    sudo apt-get install -y postgresql postgresql-contrib
fi

# Check PostgreSQL service
if pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "✅ PostgreSQL is running"
else
    echo "⚠️  PostgreSQL is not running. Attempting to start..."

    # Check if data directory exists
    if [ -d "/var/lib/postgresql/17/main" ]; then
        echo "📁 PostgreSQL data directory exists, attempting to start..."
        sudo -u postgres /usr/lib/postgresql/17/bin/pg_ctl -D /var/lib/postgresql/17/main -l /var/log/postgresql/postgresql-17-main.log start
    else
        echo "📁 Initializing new PostgreSQL instance..."
        sudo -u postgres /usr/lib/postgresql/17/bin/initdb -D /var/lib/postgresql/17/main --auth=trust
        sudo -u postgres /usr/lib/postgresql/17/bin/pg_ctl -D /var/lib/postgresql/17/main -l /var/log/postgresql/postgresql-17-main.log start
    fi
fi

# Check Redis
echo "=== Redis Status ==="
if command -v redis-cli &> /dev/null; then
    echo "✅ Redis client is installed"
else
    echo "❌ Redis not found. Installing..."
    sudo apt-get install -y redis-server
fi

# Check Redis service
if redis-cli ping &> /dev/null; then
    echo "✅ Redis is running"
else
    echo "⚠️  Redis is not running. Starting..."
    sudo redis-server --daemonize yes
fi

# Check database user and database
echo "=== Database Setup ==="
if sudo -u postgres psql -c "SELECT 1;" &> /dev/null; then
    echo "✅ PostgreSQL connection works"

    # Create user if it doesn't exist
    if ! sudo -u postgres psql -c "SELECT 1 FROM pg_user WHERE usename='platform_user';" | grep -q "1 row"; then
        echo "👤 Creating platform_user..."
        sudo -u postgres psql -c "CREATE USER platform_user WITH PASSWORD 'platform_password';"
    else
        echo "✅ platform_user exists"
    fi

    # Create database if it doesn't exist
    if ! sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='platform_db';" | grep -q "1 row"; then
        echo "🗄️  Creating platform_db..."
        sudo -u postgres psql -c "CREATE DATABASE platform_db OWNER platform_user;"
    else
        echo "✅ platform_db exists"
    fi
else
    echo "❌ Cannot connect to PostgreSQL"
fi

# Check npm dependencies
echo "=== NPM Dependencies ==="
for dir in api webapp bot; do
    if [ -d "$dir" ]; then
        echo "📦 Checking $dir dependencies..."
        cd "$dir"
        if [ ! -d "node_modules" ]; then
            echo "📦 Installing dependencies for $dir..."
            npm install
        else
            echo "✅ $dir dependencies already installed"
        fi
        cd ..
    else
        echo "⚠️  Directory $dir not found"
    fi
done

echo "=== Environment Check ==="
echo "🔍 Checking environment variables..."
echo "DB_HOST: ${DB_HOST:-localhost}"
echo "DB_PORT: ${DB_PORT:-5432}"
echo "REDIS_HOST: ${REDIS_HOST:-localhost}"
echo "REDIS_PORT: ${REDIS_PORT:-6379}"

echo "=== Port Check ==="
echo "🔍 Checking if ports are available..."
for port in 3000 4000 5432 6379; do
    if netstat -tuln | grep -q ":$port "; then
        echo "⚠️  Port $port is in use"
    else
        echo "✅ Port $port is available"
    fi
done

echo "=== Test Connections ==="
# Test database connection
if psql -h localhost -U platform_user -d platform_db -c "SELECT version();" &> /dev/null; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
fi

# Test Redis connection
if redis-cli ping &> /dev/null; then
    echo "✅ Redis connection successful"
else
    echo "❌ Redis connection failed"
fi

echo "=== Troubleshooting Complete ==="
echo "If you're still having issues, try:"
echo "1. Restart the background agent"
echo "2. Check the logs: tail -f /var/log/postgresql/postgresql-17-main.log"
echo "3. Verify services: sudo systemctl status postgresql redis-server"
