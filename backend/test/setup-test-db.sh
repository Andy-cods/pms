#!/bin/bash

# Setup script for test database
# Run this before running tests for the first time

echo "🔧 Setting up test database for BC Agency PMS..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

echo "✓ PostgreSQL is running"

# Create test database if it doesn't exist
if psql -lqt | cut -d \| -f 1 | grep -qw pms_test; then
    echo "✓ Test database 'pms_test' already exists"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing test database..."
        dropdb pms_test
        echo "Creating new test database..."
        createdb pms_test
        echo "✓ Test database recreated"
    fi
else
    echo "Creating test database..."
    createdb pms_test
    echo "✓ Test database created"
fi

# Set environment to test
export NODE_ENV=test

# Run migrations
echo "Running database migrations..."
cd "$(dirname "$0")/.."
npx prisma migrate deploy

echo "✅ Test database setup complete!"
echo ""
echo "You can now run tests with:"
echo "  npm run test:e2e"
echo ""
echo "Or run specific test suites:"
echo "  npm run test:e2e -- auth"
echo "  npm run test:e2e -- projects"
echo "  npm run test:e2e -- tasks"
echo "  npm run test:e2e -- approvals"
