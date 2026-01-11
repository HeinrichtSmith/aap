#!/bin/bash

echo "🚀 Starting Automated Code Assistant System"
echo "=========================================="
echo ""

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f cursor-bridge-server
pkill -f auto-code-processor
pkill -f monitor-requests
sleep 2

# Start the bridge server
echo "1️⃣ Starting bridge server..."
node cursor-bridge-server.cjs > bridge.log 2>&1 &
BRIDGE_PID=$!
echo "   ✅ Bridge server started (PID: $BRIDGE_PID)"

# Wait for bridge to start
sleep 2

# Start the auto processor
echo "2️⃣ Starting auto code processor..."
node auto-code-processor.cjs > processor.log 2>&1 &
PROCESSOR_PID=$!
echo "   ✅ Auto processor started (PID: $PROCESSOR_PID)"

# Start the request monitor
echo "3️⃣ Starting request monitor..."
./monitor-requests.sh > monitor.log 2>&1 &
MONITOR_PID=$!
echo "   ✅ Request monitor started (PID: $MONITOR_PID)"

echo ""
echo "✨ SYSTEM READY! ✨"
echo ""
echo "📝 How it works:"
echo "   1. Type requests in your website chatbot"
echo "   2. Simple requests are processed automatically"
echo "   3. Complex requests will alert you here"
echo "   4. Check logs/ for details"
echo ""
echo "📊 Status Dashboard:"
echo "   Bridge Server:    http://localhost:8080/api/status"
echo "   Web App:          http://localhost:5173"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $BRIDGE_PID 2>/dev/null
    kill $PROCESSOR_PID 2>/dev/null
    kill $MONITOR_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up trap for Ctrl+C
trap cleanup INT

# Keep script running and show status
while true; do
    # Check if processes are still running
    if ! kill -0 $BRIDGE_PID 2>/dev/null; then
        echo "⚠️  Bridge server stopped! Restarting..."
        node cursor-bridge-server.cjs > bridge.log 2>&1 &
        BRIDGE_PID=$!
    fi
    
    if ! kill -0 $PROCESSOR_PID 2>/dev/null; then
        echo "⚠️  Auto processor stopped! Restarting..."
        node auto-code-processor.cjs > processor.log 2>&1 &
        PROCESSOR_PID=$!
    fi
    
    sleep 5
done