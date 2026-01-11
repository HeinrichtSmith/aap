#!/usr/bin/env node

// Cursor File Watcher - Automatically alerts when new requests arrive
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const INSTRUCTIONS_FILE = path.join(__dirname, 'cursor-instructions.md');
const RESPONSE_FILE = path.join(__dirname, 'cursor-response.md');
const NOTIFICATION_SOUND = process.platform === 'darwin' ? 'afplay /System/Library/Sounds/Glass.aiff' : 'echo -e "\\a"';

let lastRequestId = null;
let isProcessing = false;

console.log('🔍 Cursor File Watcher Started');
console.log('👀 Watching for changes in cursor-instructions.md...\n');

// Function to check for new requests
function checkForNewRequest() {
  try {
    const content = fs.readFileSync(INSTRUCTIONS_FILE, 'utf8');
    
    // Extract request ID
    const requestIdMatch = content.match(/\*\*Request ID:\*\* (\d+)/);
    if (!requestIdMatch) return;
    
    const currentRequestId = requestIdMatch[1];
    
    // Check if this is a new request
    if (currentRequestId !== lastRequestId && !isProcessing) {
      lastRequestId = currentRequestId;
      isProcessing = true;
      
      console.log('\n🚨 NEW REQUEST DETECTED! 🚨');
      console.log('━'.repeat(50));
      
      // Extract request details
      const userRequestMatch = content.match(/## User Request:\n([\s\S]*?)\n\n## Instructions/);
      const userRequest = userRequestMatch ? userRequestMatch[1].trim() : 'Unknown request';
      
      console.log(`📋 Request ID: ${currentRequestId}`);
      console.log(`💬 User wants: "${userRequest}"`);
      console.log('━'.repeat(50));
      
      // Play notification sound
      exec(NOTIFICATION_SOUND, (err) => {
        if (err) console.log('Could not play notification sound');
      });
      
      // Show desktop notification (if available)
      showDesktopNotification(userRequest, currentRequestId);
      
      // Create a visual alert in terminal
      createVisualAlert(userRequest, currentRequestId);
      
      // Monitor for completion
      monitorForCompletion(currentRequestId);
    }
  } catch (error) {
    // File doesn't exist or can't be read yet
  }
}

// Function to show desktop notification
function showDesktopNotification(request, requestId) {
  const title = 'New Code Request!';
  const message = `"${request}" (ID: ${requestId})`;
  
  if (process.platform === 'darwin') {
    // macOS
    exec(`osascript -e 'display notification "${message}" with title "${title}" sound name "Glass"'`);
  } else if (process.platform === 'linux') {
    // Linux
    exec(`notify-send "${title}" "${message}"`);
  } else if (process.platform === 'win32') {
    // Windows
    exec(`msg * /time:10 "${title}: ${message}"`);
  }
}

// Function to create visual alert
function createVisualAlert(request, requestId) {
  const alertBox = `
╔════════════════════════════════════════════════════════════════╗
║                    🎯 ACTION REQUIRED 🎯                        ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Request: ${request.padEnd(52)}║
║  ID: ${requestId.padEnd(57)}║
║                                                                ║
║  1. Read the full request in cursor-instructions.md            ║
║  2. Make the requested changes                                 ║
║  3. Update cursor-response.md with:                           ║
║     - Request ID: ${requestId.padEnd(44)}║
║     - Summary of changes                                       ║
║     - Status: complete                                         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;
  
  console.log('\n' + alertBox);
  
  // Flash the alert
  let flashCount = 0;
  const flashInterval = setInterval(() => {
    if (flashCount >= 6) {
      clearInterval(flashInterval);
      return;
    }
    
    if (flashCount % 2 === 0) {
      console.log('\x1b[7m' + alertBox + '\x1b[0m'); // Inverted colors
    } else {
      console.log(alertBox);
    }
    
    flashCount++;
  }, 500);
}

// Function to monitor for completion
function monitorForCompletion(requestId) {
  console.log('\n⏳ Waiting for you to complete the request...\n');
  
  const checkInterval = setInterval(() => {
    try {
      const responseContent = fs.readFileSync(RESPONSE_FILE, 'utf8');
      
      if (responseContent.includes(requestId) && responseContent.includes('Status: complete')) {
        clearInterval(checkInterval);
        
        console.log('\n✅ REQUEST COMPLETED! ✅');
        console.log(`Response for ${requestId} has been sent back to the website.\n`);
        
        // Reset for next request
        isProcessing = false;
        
        // Clean up files after a delay
        setTimeout(() => {
          fs.writeFileSync(INSTRUCTIONS_FILE, '# Waiting for next request...');
          fs.writeFileSync(RESPONSE_FILE, '# Response will appear here...');
        }, 2000);
      }
    } catch (error) {
      // Response file doesn't exist yet
    }
  }, 1000);
  
  // Timeout after 5 minutes
  setTimeout(() => {
    clearInterval(checkInterval);
    isProcessing = false;
    console.log('\n⚠️  Request timed out. Ready for new requests.\n');
  }, 300000);
}

// Watch for changes
fs.watchFile(INSTRUCTIONS_FILE, { interval: 500 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    checkForNewRequest();
  }
});

// Also check periodically in case watch misses something
setInterval(checkForNewRequest, 1000);

// Initial check
checkForNewRequest();

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\n👋 File watcher stopped.');
  process.exit();
});

console.log('✅ Ready to receive requests from the website!\n');
console.log('💡 Tip: Keep this terminal visible to see alerts.');
console.log('   Press Ctrl+C to stop watching.\n');