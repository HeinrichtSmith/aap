#!/bin/bash

# Arrowhead Polaris - Claude Chat Assistant Startup Script
# This script starts both the frontend and backend servers

echo "🚀 Starting Arrowhead Polaris with Claude Chat Assistant..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version is too old. Please install Node.js 18+ (current: $(node --version))${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) detected${NC}"

# Check if ports are available
if port_in_use 3001; then
    echo -e "${YELLOW}⚠️  Port 3001 is already in use. Backend may not start properly.${NC}"
fi

if port_in_use 5173; then
    echo -e "${YELLOW}⚠️  Port 5173 is already in use. Frontend may not start properly.${NC}"
fi

# Install dependencies if needed
echo -e "${BLUE}Installing dependencies...${NC}"

# Frontend dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
        exit 1
    fi
fi

# Backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
    cd ..
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Create log directory
mkdir -p logs

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo -e "${BLUE}Starting backend server...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend server started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend server failed to start. Check logs/backend.log${NC}"
    exit 1
fi

# Start frontend server
echo -e "${BLUE}Starting frontend server...${NC}"
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend server started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend server failed to start. Check logs/frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}🎉 All servers started successfully!${NC}"
echo "=================================================="
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}Backend API:${NC} http://localhost:3001"
echo -e "${BLUE}WebSocket:${NC} ws://localhost:3001"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "- Click the chat button in the bottom-right corner to start chatting with Claude"
echo "- Try commands like 'Create a new component' or 'List all files'"
echo "- The chat widget supports both WebSocket and REST API fallback"
echo "- Press Ctrl+C to stop both servers"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "- Backend: logs/backend.log"
echo "- Frontend: logs/frontend.log"
echo ""
echo -e "${GREEN}Ready to chat with Claude! 🤖${NC}"

# Keep the script running and monitor processes
while true; do
    # Check if backend is still running
    if ! ps -p $BACKEND_PID > /dev/null; then
        echo -e "${RED}❌ Backend server stopped unexpectedly${NC}"
        kill $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    
    # Check if frontend is still running
    if ! ps -p $FRONTEND_PID > /dev/null; then
        echo -e "${RED}❌ Frontend server stopped unexpectedly${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    
    sleep 5
done 