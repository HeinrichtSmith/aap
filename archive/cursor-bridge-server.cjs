// Cursor AI Bridge Server
// This creates a bridge between your website and Cursor AI terminal

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

// Create HTTP server
const server = require('http').createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// Store for pending requests to Cursor
const pendingRequests = new Map();
const connectedClients = new Set();

// Instructions file that will be monitored by Cursor
const CURSOR_INSTRUCTIONS_FILE = path.join(__dirname, 'cursor-instructions.md');
const CURSOR_RESPONSE_FILE = path.join(__dirname, 'cursor-response.md');

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('✅ Website connected to bridge');
  connectedClients.add(ws);
  
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Cursor AI Bridge. You can now communicate with Claude in Cursor!',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', async (data) => {
    try {
      const payload = JSON.parse(data);
      console.log('📨 Received from website:', payload);
      
      if (payload.type === 'command' || payload.message) {
        // Handle the message
        await handleWebsiteMessage(ws, payload.message || payload.command);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process your request',
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 Website disconnected');
    connectedClients.delete(ws);
  });
});

// Handle messages from website
async function handleWebsiteMessage(ws, message) {
  const requestId = Date.now().toString();
  
  // Check if it's a code-related request
  if (isCodeRequest(message)) {
    // Create instruction file for Cursor
    const instruction = createCursorInstruction(message, requestId);
    
    // Write instruction file
    await fs.writeFile(CURSOR_INSTRUCTIONS_FILE, instruction);
    
    // Send acknowledgment
    ws.send(JSON.stringify({
      type: 'processing',
      message: '🤖 I\'m preparing your request for Claude in Cursor...',
      requestId
    }));
    
    // Store the WebSocket connection for this request
    pendingRequests.set(requestId, ws);
    
    // Open the instruction file in Cursor (if possible)
    try {
      await openInCursor(CURSOR_INSTRUCTIONS_FILE);
    } catch (error) {
      console.log('ℹ️ Could not auto-open in Cursor, please check cursor-instructions.md');
    }
    
    // Start monitoring for response
    monitorCursorResponse(requestId);
  } else {
    // Handle non-code requests locally
    const response = await handleLocalCommand(message);
    ws.send(JSON.stringify(response));
  }
}

// Check if message is code-related
function isCodeRequest(message) {
  const codeKeywords = [
    'change', 'modify', 'update', 'create', 'add', 'fix', 'refactor',
    'implement', 'component', 'function', 'file', 'code', 'bug',
    'feature', 'enhance', 'improve', 'delete', 'remove', 'make',
    'bigger', 'smaller', 'color', 'style', 'move', 'rename',
    'header', 'footer', 'button', 'page', 'layout', 'design'
  ];
  
  const lowerMessage = message.toLowerCase();
  const isCode = codeKeywords.some(keyword => lowerMessage.includes(keyword));
  
  console.log(`📝 Checking message: "${message}"`);
  console.log(`   Is code request: ${isCode}`);
  
  return isCode;
}

// Create instruction file for Cursor
function createCursorInstruction(message, requestId) {
  return `# Code Request from Website Chatbot

**Request ID:** ${requestId}
**Timestamp:** ${new Date().toISOString()}
**From:** Website Chatbot Interface

## User Request:
${message}

## Instructions for Claude in Cursor:
1. Please process this code request
2. Make any necessary changes to the codebase
3. When complete, create a summary of changes in cursor-response.md
4. Include the Request ID in your response

## Response Format:
Please structure your response in cursor-response.md as:

\`\`\`markdown
# Response to Request ${requestId}

## Summary:
[Brief summary of what was done]

## Changes Made:
- [List of files changed]
- [Key modifications]

## Status: complete
\`\`\`

---
Note: This is an automated request from the website chatbot interface.`;
}

// Monitor for Cursor response
async function monitorCursorResponse(requestId) {
  const maxAttempts = 60; // 1 minute timeout
  let attempts = 0;
  
  const checkInterval = setInterval(async () => {
    attempts++;
    
    try {
      // Check if response file exists
      const responseContent = await fs.readFile(CURSOR_RESPONSE_FILE, 'utf8');
      
      // Check if response contains our request ID
      if (responseContent.includes(requestId) && responseContent.includes('Status: complete')) {
        clearInterval(checkInterval);
        
        // Parse response
        const response = parseResponse(responseContent, requestId);
        
        // Send to website
        const ws = pendingRequests.get(requestId);
        if (ws) {
          ws.send(JSON.stringify({
            type: 'response',
            message: response.summary || 'Changes completed successfully!',
            details: response,
            requestId
          }));
          pendingRequests.delete(requestId);
        }
        
        // Clean up files
        await fs.unlink(CURSOR_RESPONSE_FILE).catch(() => {});
        await fs.unlink(CURSOR_INSTRUCTIONS_FILE).catch(() => {});
      }
    } catch (error) {
      // File doesn't exist yet or error reading
    }
    
    if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      const ws = pendingRequests.get(requestId);
      if (ws) {
        ws.send(JSON.stringify({
          type: 'timeout',
          message: 'Request timed out. Please check cursor-instructions.md in Cursor and respond manually.',
          requestId
        }));
        pendingRequests.delete(requestId);
      }
    }
  }, 1000);
}

// Parse response from Cursor
function parseResponse(content, requestId) {
  const lines = content.split('\n');
  const response = {
    summary: '',
    changes: [],
    raw: content
  };
  
  let inSummary = false;
  let inChanges = false;
  
  for (const line of lines) {
    if (line.includes('## Summary:')) {
      inSummary = true;
      inChanges = false;
    } else if (line.includes('## Changes Made:')) {
      inSummary = false;
      inChanges = true;
    } else if (line.includes('## Status:')) {
      break;
    } else if (inSummary && line.trim()) {
      response.summary += line.trim() + ' ';
    } else if (inChanges && line.trim().startsWith('-')) {
      response.changes.push(line.trim().substring(1).trim());
    }
  }
  
  return response;
}

// Try to open file in Cursor
async function openInCursor(filePath) {
  try {
    // Try different methods to open in Cursor
    if (process.platform === 'darwin') {
      await execPromise(`open -a "Cursor" "${filePath}"`);
    } else if (process.platform === 'win32') {
      await execPromise(`start cursor "${filePath}"`);
    } else {
      await execPromise(`cursor "${filePath}"`);
    }
  } catch (error) {
    console.log('Could not auto-open in Cursor:', error.message);
  }
}

// Handle local commands (non-code requests)
async function handleLocalCommand(message) {
  const cmd = message.toLowerCase().trim();
  
  if (cmd.includes('status')) {
    return {
      type: 'status',
      message: `✅ Cursor AI Bridge Status:
• Bridge Server: Active
• WebSocket Clients: ${connectedClients.size}
• Pending Requests: ${pendingRequests.size}
• Mode: Cursor AI Integration

To make code changes, just describe what you want!`
    };
  }
  
  if (cmd.includes('help')) {
    return {
      type: 'help',
      message: `🤖 Cursor AI Bridge Commands:

**Code Requests:**
Just describe what you want to change, for example:
• "Add a search bar to the dashboard"
• "Fix the login button color"
• "Create a new component for user profiles"

**System Commands:**
• /status - Check bridge status
• /help - Show this help

**How it works:**
1. You request code changes through this chat
2. I create instructions for Claude in Cursor
3. Claude makes the changes in Cursor
4. You get notified when complete!`
    };
  }
  
  return {
    type: 'info',
    message: 'For code changes, please describe what you want to modify. For other commands, type /help.'
  };
}

// REST API endpoint for manual responses
app.post('/api/response', async (req, res) => {
  const { requestId, response } = req.body;
  
  const ws = pendingRequests.get(requestId);
  if (ws) {
    ws.send(JSON.stringify({
      type: 'response',
      message: response,
      requestId
    }));
    pendingRequests.delete(requestId);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Request not found' });
  }
});

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'active',
    mode: 'cursor-bridge',
    clients: connectedClients.size,
    pending: pendingRequests.size
  });
});

// Start server
server.listen(port, () => {
  console.log(`🚀 Cursor AI Bridge Server running on:`);
  console.log(`   HTTP API: http://localhost:${port}/api`);
  console.log(`   WebSocket: ws://localhost:${port}/ws`);
  console.log(`\n📝 Instructions:`);
  console.log(`1. Your website chatbot will connect to this bridge`);
  console.log(`2. When you request code changes, check cursor-instructions.md`);
  console.log(`3. Make changes in Cursor, then create cursor-response.md`);
  console.log(`4. The bridge will send the response back to your website\n`);
});