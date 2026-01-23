#!/bin/bash

# Test runner script with options
# Usage: ./run-tests.sh [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 BC Agency PMS - Integration Tests"
echo "===================================="
echo ""

# Check if test database exists
if ! psql -lqt | cut -d \| -f 1 | grep -qw pms_test; then
    echo -e "${RED}❌ Test database 'pms_test' not found${NC}"
    echo "Please run setup-test-db.sh first"
    exit 1
fi

# Parse arguments
COVERAGE=false
WATCH=false
SUITE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage|-c)
            COVERAGE=true
            shift
            ;;
        --watch|-w)
            WATCH=true
            shift
            ;;
        auth|projects|tasks|approvals)
            SUITE=$1
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./run-tests.sh [--coverage] [--watch] [auth|projects|tasks|approvals]"
            exit 1
            ;;
    esac
done

# Build test command
CMD="npm run test:e2e --"

if [ ! -z "$SUITE" ]; then
    echo -e "${YELLOW}Running ${SUITE} tests...${NC}"
    CMD="$CMD $SUITE"
else
    echo -e "${YELLOW}Running all integration tests...${NC}"
fi

if [ "$COVERAGE" = true ]; then
    echo -e "${YELLOW}With coverage report${NC}"
    CMD="$CMD --coverage"
fi

if [ "$WATCH" = true ]; then
    echo -e "${YELLOW}In watch mode${NC}"
    CMD="$CMD --watch"
fi

echo ""

# Run tests
cd "$(dirname "$0")/.."
eval $CMD

# Display results
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"

    if [ "$COVERAGE" = true ]; then
        echo ""
        echo "Coverage report: coverage-e2e/index.html"
    fi
else
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
