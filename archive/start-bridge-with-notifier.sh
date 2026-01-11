#!/bin/bash

echo "🚀 Starting Cursor Bridge with Notifier"
echo "======================================"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f cursor-bridge-server
pkill -f cursor-notifier
sleep 1

# Start the bridge server
echo "1️⃣ Starting bridge server..."
node cursor-bridge-server.cjs > bridge.log 2>&1 &
BRIDGE_PID=$!
echo "   ✅ Bridge server started (PID: $BRIDGE_PID)"

# Start the notifier in a new terminal if possible
echo "2️⃣ Starting request notifier..."
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "./cursor-notifier.sh; exec bash" &
elif command -v xterm &> /dev/null; then
    xterm -e "./cursor-notifier.sh" &
else
    # Run in background if no terminal available
    ./cursor-notifier.sh &
    NOTIFIER_PID=$!
    echo "   ✅ Notifier started in background (PID: $NOTIFIER_PID)"
fi

echo ""
echo "✨ SYSTEM READY! ✨"
echo ""
echo "📝 How it works:"
echo "   1. Send requests from your website"
echo "   2. NOTIFIER will alert you when requests arrive"
echo "   3. Open cursor-instructions.md in Cursor"
echo "   4. Process the request with Claude"
echo "   5. Save response in cursor-response.md"
echo ""
echo "💡 TIP: Keep the notifier terminal visible!"
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
    pkill -f cursor-notifier
    echo "✅ All services stopped"
    exit 0
}

# Set up trap for Ctrl+C
trap cleanup INT

# Keep script running
while true; do
    # Check if bridge is still running
    if ! kill -0 $BRIDGE_PID 2>/dev/null; then
        echo "⚠️  Bridge server stopped! Restarting..."
        node cursor-bridge-server.cjs > bridge.log 2>&1 &
        BRIDGE_PID=$!
    fi
    
    sleep 5
done