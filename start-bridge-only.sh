#!/bin/bash

echo "🚀 Starting Cursor Bridge Server Only"
echo "===================================="
echo ""

# Kill any existing bridge server
echo "🧹 Cleaning up old processes..."
pkill -f cursor-bridge-server
sleep 1

# Start ONLY the bridge server
echo "1️⃣ Starting bridge server..."
node cursor-bridge-server.cjs &
BRIDGE_PID=$!
echo "   ✅ Bridge server started (PID: $BRIDGE_PID)"

echo ""
echo "✨ BRIDGE READY! ✨"
echo ""
echo "📝 How it works:"
echo "   1. Type requests in your website chatbot"
echo "   2. Requests will create cursor-instructions.md"
echo "   3. Open cursor-instructions.md in Cursor"
echo "   4. Claude will process the request"
echo "   5. Save response in cursor-response.md"
echo ""
echo "📊 Status Dashboard:"
echo "   Bridge Server:    http://localhost:8080/api/status"
echo "   Web App:          http://localhost:5173"
echo ""
echo "🛑 Press Ctrl+C to stop"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping bridge server..."
    kill $BRIDGE_PID 2>/dev/null
    echo "✅ Bridge server stopped"
    exit 0
}

# Set up trap for Ctrl+C
trap cleanup INT

# Keep script running
while true; do
    # Check if process is still running
    if ! kill -0 $BRIDGE_PID 2>/dev/null; then
        echo "⚠️  Bridge server stopped! Restarting..."
        node cursor-bridge-server.cjs &
        BRIDGE_PID=$!
    fi
    
    sleep 5
done