#!/bin/bash

echo "🚀 Starting Cursor AI Bridge..."
echo ""
echo "This will connect your website chatbot to Claude in Cursor!"
echo ""

# Start the bridge server
node cursor-bridge-server.js &
BRIDGE_PID=$!

echo "✅ Bridge server started (PID: $BRIDGE_PID)"
echo ""
echo "📝 Instructions:"
echo "1. Open your website and click the chat bubble"
echo "2. Request code changes like 'Add a dark mode toggle'"
echo "3. Check cursor-instructions.md in Cursor"
echo "4. I'll make the changes and update cursor-response.md"
echo "5. The website will show when changes are complete!"
echo ""
echo "Press Ctrl+C to stop the bridge"

# Wait for Ctrl+C
trap "kill $BRIDGE_PID; exit" INT
wait