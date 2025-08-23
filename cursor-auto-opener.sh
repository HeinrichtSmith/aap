#!/bin/bash

echo "🤖 Cursor Auto-Opener Started"
echo "============================="
echo ""
echo "This script will automatically open cursor-instructions.md in Cursor"
echo "whenever a new request arrives."
echo ""

INSTRUCTIONS_FILE="cursor-instructions.md"
LAST_MODIFIED=""
CURSOR_CMD=""

# Try to find cursor command
if command -v cursor &> /dev/null; then
    CURSOR_CMD="cursor"
elif command -v code &> /dev/null; then
    CURSOR_CMD="code"
    echo "⚠️  Using 'code' command instead of 'cursor'"
elif [ -f "/usr/local/bin/cursor" ]; then
    CURSOR_CMD="/usr/local/bin/cursor"
elif [ -f "$HOME/.local/bin/cursor" ]; then
    CURSOR_CMD="$HOME/.local/bin/cursor"
else
    echo "❌ ERROR: Could not find cursor or code command"
    echo "Please install Cursor's command line tool:"
    echo "  In Cursor: View > Command Palette > 'Install code command'"
    exit 1
fi

echo "✅ Using command: $CURSOR_CMD"
echo ""

while true; do
    if [ -f "$INSTRUCTIONS_FILE" ]; then
        CURRENT_MODIFIED=$(stat -c %Y "$INSTRUCTIONS_FILE" 2>/dev/null || stat -f %m "$INSTRUCTIONS_FILE" 2>/dev/null)
        
        if [ "$CURRENT_MODIFIED" != "$LAST_MODIFIED" ]; then
            LAST_MODIFIED="$CURRENT_MODIFIED"
            
            echo "🎯 New request detected at $(date)"
            echo "📂 Opening in Cursor..."
            
            # Open the file in Cursor
            $CURSOR_CMD "$INSTRUCTIONS_FILE"
            
            # Also try to focus the window (Linux)
            if command -v wmctrl &> /dev/null; then
                sleep 0.5
                wmctrl -a "Cursor" 2>/dev/null || wmctrl -a "Code" 2>/dev/null
            fi
            
            # Try to focus (macOS)
            if command -v osascript &> /dev/null; then
                osascript -e 'tell application "Cursor" to activate' 2>/dev/null ||
                osascript -e 'tell application "Visual Studio Code" to activate' 2>/dev/null
            fi
            
            echo "✅ File opened in Cursor"
            echo ""
        fi
    fi
    
    sleep 1
done