#!/bin/bash

# 1. Exit immediately if a command fails
set -e

# 2. Get the directory of the script and find the project root (one level up)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 3. Colors for better terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${GREEN}${BOLD}>>> Initializing Test Suite from $PROJECT_ROOT${NC}"

# 4. Move to project root to ensure pytest finds everything
cd "$PROJECT_ROOT"

# 5. Set Environment Variables for Testing (Isolation)
export ENV=testing
export API_KEY="test_master_key"
export PYTHONPATH=$PYTHONPATH:.

# 6. Check for required dependencies
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}Error: pytest not found. Install it with: pip install pytest httpx pytest-cov${NC}"
    exit 1
fi

# 7. Execute the tests
# --cov=app: Measures coverage of your app directory
# --cov-report=term-missing: Shows which lines are not tested
echo -e "${GREEN}Running pytest...${NC}"
pytest -v -s --cov=app --cov-report=term-missing tests/

# 8. Success/Failure messaging
if [ $? -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ All tests passed successfully!${NC}"
else
    echo -e "${RED}${BOLD}❌ Tests failed. Check the logs above.${NC}"
    exit 1
fi
