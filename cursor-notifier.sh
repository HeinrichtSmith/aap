#!/bin/bash

echo "🔔 Cursor Request Notifier Started"
echo "===================================="
echo ""
echo "Monitoring for new requests..."
echo ""

INSTRUCTIONS_FILE="cursor-instructions.md"
LAST_MODIFIED=""

while true; do
    if [ -f "$INSTRUCTIONS_FILE" ]; then
        CURRENT_MODIFIED=$(stat -c %Y "$INSTRUCTIONS_FILE" 2>/dev/null || stat -f %m "$INSTRUCTIONS_FILE" 2>/dev/null)
        
        if [ "$CURRENT_MODIFIED" != "$LAST_MODIFIED" ]; then
            LAST_MODIFIED="$CURRENT_MODIFIED"
            
            # Clear screen and show alert
            clear
            echo "🚨 🚨 🚨 NEW REQUEST RECEIVED! 🚨 🚨 🚨"
            echo "====================================="
            echo ""
            echo "📝 New code request in: cursor-instructions.md"
            echo "⏰ Time: $(date)"
            echo ""
            echo "REQUEST CONTENT:"
            echo "----------------"
            head -n 15 "$INSTRUCTIONS_FILE"
            echo ""
            echo "🎯 ACTION REQUIRED:"
            echo "1. Open cursor-instructions.md in Cursor"
            echo "2. Process the request"
            echo "3. Save response in cursor-response.md"
            echo ""
            
            # Try to send desktop notification if available
            if command -v notify-send &> /dev/null; then
                notify-send "Cursor Request Alert" "New code request received! Check cursor-instructions.md" -u critical
            fi
            
            # Make a sound if possible
            echo -e "\a"
        fi
    fi
    
    sleep 1
done