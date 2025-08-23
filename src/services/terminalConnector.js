// Terminal System Connector
// This file handles the connection between the chatbot and your terminal middleware

import localTerminalConnector from './localTerminalConnector';

class TerminalConnector {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.messageQueue = [];
    this.onMessageCallback = null;
    this.onStatusChangeCallback = null;
    
    // Configuration - Update these to match your terminal system
    this.config = {
      // WebSocket endpoint for terminal system
      // Set to 'local' to use local mode without WebSocket
      wsEndpoint: import.meta.env?.VITE_TERMINAL_WS_URL || 'local',
      
      // HTTP API endpoint for terminal system (fallback)
      apiEndpoint: import.meta.env?.VITE_TERMINAL_API_URL || 'http://localhost:8080/api',
      
      // Use local mode by default if no WebSocket URL is provided
      useLocalMode: !import.meta.env?.VITE_TERMINAL_WS_URL,
      
      // Reconnection settings
      reconnectInterval: 5000,
      maxReconnectAttempts: 2, // Reduced to fail faster
      
      // Authentication token (if required)
      authToken: import.meta.env?.VITE_TERMINAL_AUTH_TOKEN || null
    };
    
    this.reconnectAttempts = 0;
  }

  // Connect to the terminal system via WebSocket
  connect() {
    // Check if we should skip WebSocket and use local mode
    if (this.config.wsEndpoint === 'local' || this.config.useLocalMode) {
      console.log('📍 Using local terminal mode');
      this.fallbackToLocal();
      return;
    }
    
    try {
      console.log('🔌 Connecting to terminal system...');
      
      this.ws = new WebSocket(this.config.wsEndpoint);
      
      this.ws.onopen = () => {
        console.log('✅ Connected to terminal system');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Send any queued messages
        this.messageQueue.forEach(msg => this.sendMessage(msg));
        this.messageQueue = [];
        
        // Notify status change
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback(true);
        }
        
        // Send authentication if required
        if (this.config.authToken) {
          this.ws.send(JSON.stringify({
            type: 'auth',
            token: this.config.authToken
          }));
        }
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received from terminal:', data);
          
          if (this.onMessageCallback) {
            this.onMessageCallback(data);
          }
        } catch (error) {
          console.error('❌ Error parsing terminal message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ Terminal WebSocket error:', error);
      };
      
      this.ws.onclose = () => {
        console.log('🔌 Disconnected from terminal system');
        this.isConnected = false;
        
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback(false);
        }
        
        // Attempt to reconnect
        this.attemptReconnect();
      };
      
    } catch (error) {
      console.error('❌ Failed to connect to terminal system:', error);
      this.fallbackToLocal();
    }
  }

  // Attempt to reconnect to WebSocket
  attemptReconnect() {
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.config.reconnectInterval);
    } else {
      console.log('❌ Max reconnection attempts reached, falling back to local mode');
      this.fallbackToLocal();
    }
  }

  // Fallback to local terminal simulator
  fallbackToLocal() {
    console.log('🔄 Switching to local terminal mode');
    
    // Set up local terminal handlers
    localTerminalConnector.onMessage((data) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(data);
      }
    });
    
    localTerminalConnector.onStatusChange((status) => {
      this.isConnected = status;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(status);
      }
    });
    
    // Process any queued messages
    this.messageQueue.forEach(msg => {
      localTerminalConnector.sendMessage(msg);
    });
    this.messageQueue = [];
  }

  // Send a message to the terminal system
  sendMessage(message) {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'command',
        message: message,
        timestamp: new Date().toISOString()
      };
      
      this.ws.send(JSON.stringify(payload));
      console.log('📤 Sent to terminal:', payload);
    } else if (this.isConnected && !this.ws) {
      // Using local mode
      localTerminalConnector.sendMessage(message);
    } else {
      // Queue the message if not connected
      this.messageQueue.push(message);
      console.log('📦 Queued message for later delivery');
      
      // Try local mode
      this.fallbackToLocal();
      localTerminalConnector.sendMessage(message);
    }
  }

  // Fallback to HTTP API if WebSocket fails
  async sendViaAPI(message) {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.config.authToken ? `Bearer ${this.config.authToken}` : ''
        },
        body: JSON.stringify({
          message: message,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📨 API Response:', data);
      
      if (this.onMessageCallback) {
        this.onMessageCallback(data);
      }
      
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      
      // Return a fallback response
      return {
        type: 'error',
        message: 'Failed to connect to terminal system. Please check your connection.',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Set callback for incoming messages
  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  // Set callback for connection status changes
  onStatusChange(callback) {
    this.onStatusChangeCallback = callback;
  }

  // Disconnect from the terminal system
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.messageQueue = [];
  }

  // Execute a terminal command
  async executeCommand(command) {
    // If using local mode, delegate to local connector
    if (this.isConnected && !this.ws) {
      return localTerminalConnector.executeCommand(command);
    }
    
    if (command.startsWith('/')) {
      // Handle special commands
      switch (command) {
        case '/status':
          return this.getSystemStatus();
        case '/help':
          return this.getHelpText();
        case '/clear':
          return { type: 'clear', message: 'Terminal cleared' };
        default:
          // Send to terminal system
          this.sendMessage(command);
          return { type: 'command', message: `Executing: ${command}` };
      }
    } else {
      // Regular message
      this.sendMessage(command);
      return { type: 'message', message: `Sent: ${command}` };
    }
  }

  // Get system status
  async getSystemStatus() {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/status`);
      const data = await response.json();
      
      return {
        type: 'status',
        message: `System Status:\n• Connection: ${this.isConnected ? 'Active' : 'Inactive'}\n• Queue: ${this.messageQueue.length} messages\n• Uptime: ${data.uptime || 'Unknown'}`,
        data: data
      };
    } catch (error) {
      return {
        type: 'error',
        message: 'Failed to retrieve system status'
      };
    }
  }

  // Get help text
  getHelpText() {
    return {
      type: 'help',
      message: `🤖 Arrowhead Polaris Terminal Commands:

📦 Order Management:
• /orders - View all pending orders
• /order [ID] - View specific order details
• /pick [ORDER_ID] - Start picking process
• /pack [TOTE_ID] - Start packing process
• /ship [ORDER_ID] - Process shipping

📊 Stock Control:
• /stock [SKU] - Check stock levels for specific SKU
• /stock low - View low stock items
• /stock critical - View critical stock items
• /adjust [SKU] [QTY] - Adjust stock quantity

📥 Inwards Goods:
• /po list - List purchase orders
• /po [ID] - View purchase order details
• /receive [PO_ID] - Start receiving process

🔧 System Commands:
• /status - Check system status
• /stats - View warehouse statistics
• /alerts - View active alerts
• /clear - Clear terminal
• /help - Show this help

💡 Tips:
- Use TAB for command completion
- Commands are case-insensitive
- Regular messages are forwarded to support`
    };
  }

  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Reconnect if endpoint changed
    if (newConfig.wsEndpoint || newConfig.apiEndpoint) {
      this.disconnect();
      this.connect();
    }
  }
}

// Create singleton instance
const terminalConnector = new TerminalConnector();

// Export methods for use in React components
export const connectToTerminal = () => terminalConnector.connect();
export const disconnectFromTerminal = () => terminalConnector.disconnect();
export const sendTerminalMessage = (message) => terminalConnector.sendMessage(message);
export const executeTerminalCommand = (command) => terminalConnector.executeCommand(command);
export const onTerminalMessage = (callback) => terminalConnector.onMessage(callback);
export const onTerminalStatusChange = (callback) => terminalConnector.onStatusChange(callback);
export const updateTerminalConfig = (config) => terminalConnector.updateConfig(config);
export const getTerminalStatus = () => terminalConnector.isConnected;

export default terminalConnector;