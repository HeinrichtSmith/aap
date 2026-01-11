// Mock Terminal Server for Testing
// Run with: node mock-terminal-server.js

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();
const port = 8080;

// Enable CORS for API
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// Mock data
const mockOrders = [
  { id: 'ORD-2025-001', customer: 'Auckland Security', items: 5, status: 'pending', priority: 'urgent' },
  { id: 'ORD-2025-002', customer: 'Wellington Tech', items: 3, status: 'pending', priority: 'normal' },
  { id: 'ORD-2025-003', customer: 'Christchurch Supplies', items: 8, status: 'picking', priority: 'overnight' }
];

const mockStock = [
  { sku: 'SKU-0001', name: 'PIR Motion Sensor', quantity: 245, location: 'A-01-01' },
  { sku: 'SKU-0002', name: 'Door Contact Sensor', quantity: 12, location: 'B-02-03' },
  { sku: 'SKU-0003', name: 'Glass Break Detector', quantity: 89, location: 'C-01-02' }
];

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('✅ New WebSocket connection established');
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Arrowhead Polaris Terminal System v1.0',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const payload = JSON.parse(data);
      console.log('📨 Received:', payload);
      
      // Process command
      if (payload.type === 'command') {
        handleCommand(ws, payload.message);
      } else {
        // Echo back for general messages
        ws.send(JSON.stringify({
          type: 'response',
          message: `Terminal received: "${payload.message}"`,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
});

// Command handler
function handleCommand(ws, command) {
  const cmd = command.toLowerCase().trim();
  
  if (cmd === '/orders') {
    ws.send(JSON.stringify({
      type: 'orders',
      message: `Found ${mockOrders.length} pending orders:\n${mockOrders.map(o => 
        `• ${o.id} - ${o.customer} (${o.items} items) [${o.priority.toUpperCase()}]`
      ).join('\n')}`,
      data: mockOrders,
      timestamp: new Date().toISOString()
    }));
  }
  else if (cmd.startsWith('/order ')) {
    const orderId = cmd.split(' ')[1];
    const order = mockOrders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
    
    if (order) {
      ws.send(JSON.stringify({
        type: 'order_detail',
        message: `Order ${order.id}:\nCustomer: ${order.customer}\nItems: ${order.items}\nStatus: ${order.status}\nPriority: ${order.priority}`,
        data: order,
        timestamp: new Date().toISOString()
      }));
    } else {
      ws.send(JSON.stringify({
        type: 'error',
        message: `Order ${orderId} not found`,
        timestamp: new Date().toISOString()
      }));
    }
  }
  else if (cmd.startsWith('/stock ')) {
    const sku = cmd.split(' ')[1];
    
    if (sku === 'low') {
      const lowStock = mockStock.filter(s => s.quantity < 50);
      ws.send(JSON.stringify({
        type: 'stock_low',
        message: `Low stock items (${lowStock.length}):\n${lowStock.map(s => 
          `• ${s.sku} - ${s.name}: ${s.quantity} units`
        ).join('\n')}`,
        data: lowStock,
        timestamp: new Date().toISOString()
      }));
    } else {
      const item = mockStock.find(s => s.sku.toLowerCase() === sku.toLowerCase());
      
      if (item) {
        ws.send(JSON.stringify({
          type: 'stock_detail',
          message: `Stock for ${item.sku}:\nName: ${item.name}\nQuantity: ${item.quantity}\nLocation: ${item.location}`,
          data: item,
          timestamp: new Date().toISOString()
        }));
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: `SKU ${sku} not found`,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }
  else if (cmd === '/status') {
    ws.send(JSON.stringify({
      type: 'status',
      message: `System Status: ✅ All Systems Operational\nOrders: ${mockOrders.length} pending\nLow Stock Items: ${mockStock.filter(s => s.quantity < 50).length}\nActive Pickers: 3\nUptime: 99.9%`,
      data: {
        operational: true,
        orders: mockOrders.length,
        lowStock: mockStock.filter(s => s.quantity < 50).length,
        uptime: '99.9%'
      },
      timestamp: new Date().toISOString()
    }));
  }
  else {
    ws.send(JSON.stringify({
      type: 'unknown',
      message: `Unknown command: ${command}\nType /help for available commands`,
      timestamp: new Date().toISOString()
    }));
  }
}

// REST API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    uptime: '99.9%',
    connections: wss.clients.size,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/send', (req, res) => {
  const { message } = req.body;
  
  // Process message and return response
  res.json({
    type: 'api_response',
    message: `API received: "${message}"`,
    timestamp: new Date().toISOString()
  });
});

// Start server
server.listen(port, () => {
  console.log(`🚀 Mock Terminal Server running on:`);
  console.log(`   HTTP API: http://localhost:${port}/api`);
  console.log(`   WebSocket: ws://localhost:${port}/ws`);
  console.log(`\n📡 Waiting for connections...`);
});