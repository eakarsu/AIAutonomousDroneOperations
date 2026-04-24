#!/bin/bash

# ============================================================
# AI Autonomous Drone Operations - Startup Script
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "  =================================================="
echo "   AI Autonomous Drone Operations Platform"
echo "   Starting up..."
echo "  =================================================="
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}[OK]${NC} Environment variables loaded"
else
    echo -e "${RED}[ERROR]${NC} .env file not found!"
    exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-4000}
FRONTEND_PORT=${FRONTEND_PORT:-3001}

# ============================================================
# Kill processes on used ports
# ============================================================
echo -e "\n${YELLOW}[STEP 1]${NC} Cleaning up used ports..."

kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "  ${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
echo -e "${GREEN}[OK]${NC} Ports $BACKEND_PORT and $FRONTEND_PORT are free"

# ============================================================
# Check PostgreSQL
# ============================================================
echo -e "\n${YELLOW}[STEP 2]${NC} Checking PostgreSQL..."

if ! command -v psql &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} PostgreSQL is not installed!"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    sleep 3
fi

echo -e "${GREEN}[OK]${NC} PostgreSQL is running"

# Create database if not exists
echo -e "  Creating database '${DB_NAME}'..."
psql -U ${DB_USER:-postgres} -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME:-drone_operations}'" 2>/dev/null | grep -q 1 || \
    createdb -U ${DB_USER:-postgres} ${DB_NAME:-drone_operations} 2>/dev/null || true
echo -e "${GREEN}[OK]${NC} Database '${DB_NAME:-drone_operations}' ready"

# ============================================================
# Install dependencies
# ============================================================
echo -e "\n${YELLOW}[STEP 3]${NC} Installing dependencies..."

echo -e "  Installing backend dependencies..."
cd backend
npm install --silent 2>&1 | tail -1
cd ..

echo -e "  Installing frontend dependencies..."
cd frontend
npm install --silent 2>&1 | tail -1
cd ..

echo -e "${GREEN}[OK]${NC} Dependencies installed"

# ============================================================
# Seed Database
# ============================================================
echo -e "\n${YELLOW}[STEP 4]${NC} Seeding database with demo data..."
cd backend
node seed.js
cd ..
echo -e "${GREEN}[OK]${NC} Database seeded with demo data"

# ============================================================
# Start Backend with Hot Reload (nodemon)
# ============================================================
echo -e "\n${YELLOW}[STEP 5]${NC} Starting backend server with hot reload..."
cd backend
npx nodemon server.js &
BACKEND_PID=$!
cd ..
sleep 3
echo -e "${GREEN}[OK]${NC} Backend running on port $BACKEND_PORT (PID: $BACKEND_PID)"

# ============================================================
# Start Frontend with Hot Reload (React Scripts)
# ============================================================
echo -e "\n${YELLOW}[STEP 6]${NC} Starting frontend with hot reload..."
cd frontend
BROWSER=none PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!
cd ..

echo -e "\n${PURPLE}"
echo "  =================================================="
echo "   AI Drone Operations Platform is Starting!"
echo "  =================================================="
echo -e "${NC}"
echo -e "  ${CYAN}Frontend:${NC}  http://localhost:$FRONTEND_PORT"
echo -e "  ${CYAN}Backend:${NC}   http://localhost:$BACKEND_PORT"
echo -e ""
echo -e "  ${YELLOW}Login Credentials:${NC}"
echo -e "    Email:    admin@droneops.com"
echo -e "    Password: admin123"
echo -e ""
echo -e "  ${GREEN}Press Ctrl+C to stop all services${NC}"
echo ""

# Cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
