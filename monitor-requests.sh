#!/bin/bash

echo "📡 Monitoring for code requests..."
echo "When you see a request, check cursor-instructions.md"
echo ""

# Monitor the instructions file
tail -f cursor-instructions.md | while read line; do
    if [[ $line == *"Request ID:"* ]]; then
        echo ""
        echo "🚨 NEW REQUEST DETECTED! 🚨"
        echo "$line"
        echo "Check cursor-instructions.md for details!"
        echo ""
        
        # Try to play a sound
        if [[ "$OSTYPE" == "darwin"* ]]; then
            afplay /System/Library/Sounds/Glass.aiff 2>/dev/null &
        else
            echo -e "\a"
        fi
    fi
done