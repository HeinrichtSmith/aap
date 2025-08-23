// Local Terminal Connector - Works without external WebSocket
// This simulates a terminal system using local storage and the app's existing data

import { initialOrders } from '../data/pickingData';
import { initialTotes } from '../data/packingData';
import binsData from '../data/bins.json';

class LocalTerminalConnector {
  constructor() {
    this.isConnected = true; // Always "connected" for local mode
    this.messageHandlers = [];
    this.statusHandlers = [];
    
    // Simulate connection after a short delay
    setTimeout(() => {
      this.notifyStatusChange(true);
    }, 500);
  }

  // Add message handler
  onMessage(callback) {
    this.messageHandlers.push(callback);
  }

  // Add status change handler
  onStatusChange(callback) {
    this.statusHandlers.push(callback);
    // Immediately notify current status
    callback(this.isConnected);
  }

  // Notify all message handlers
  notifyMessage(data) {
    this.messageHandlers.forEach(handler => handler(data));
  }

  // Notify all status handlers
  notifyStatusChange(status) {
    this.statusHandlers.forEach(handler => handler(status));
  }

  // Send message (process locally)
  sendMessage(message) {
    // Simulate processing delay
    setTimeout(() => {
      const response = this.processMessage(message);
      this.notifyMessage(response);
    }, 300 + Math.random() * 500);
  }

  // Execute command
  async executeCommand(command) {
    const response = this.processCommand(command);
    
    // Send response through message handlers
    setTimeout(() => {
      this.notifyMessage(response);
    }, 300);
    
    return {
      type: 'command',
      message: `Processing: ${command}`
    };
  }

  // Process regular messages
  processMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help')) {
      return {
        type: 'help',
        message: `I can help you with:
• Order Management - View and process orders
• Stock Control - Check inventory levels
• Picking & Packing - Start fulfillment processes
• System Status - Check warehouse metrics

Try commands like /orders, /stock, or ask me anything!`
      };
    }
    
    if (lowerMessage.includes('order') || lowerMessage.includes('pick')) {
      const orders = this.getOrders();
      return {
        type: 'info',
        message: `You have ${orders.length} orders ready for picking. The highest priority is ${orders[0]?.orderId || 'N/A'}. Type /orders to see all.`
      };
    }
    
    if (lowerMessage.includes('stock') || lowerMessage.includes('inventory')) {
      const lowStock = this.getLowStock();
      return {
        type: 'info',
        message: `Stock levels are being monitored. ${lowStock.length} items are running low. Type /stock low to see details.`
      };
    }
    
    return {
      type: 'response',
      message: `I understand you're asking about "${message}". Try using specific commands like /orders or /stock for detailed information.`
    };
  }

  // Process commands
  processCommand(command) {
    const cmd = command.toLowerCase().trim();
    
    switch (cmd) {
      case '/help':
        return this.getHelp();
      
      case '/orders':
        return this.getOrdersList();
      
      case '/stock low':
        return this.getLowStockList();
      
      case '/status':
        return this.getSystemStatus();
      
      case '/stats':
        return this.getWarehouseStats();
      
      case '/clear':
        return { type: 'clear', message: 'Terminal cleared' };
      
      default:
        if (cmd.startsWith('/order ')) {
          return this.getOrderDetail(cmd.split(' ')[1]);
        }
        if (cmd.startsWith('/stock ')) {
          return this.getStockDetail(cmd.split(' ')[1]);
        }
        if (cmd.startsWith('/pick ')) {
          return this.startPicking(cmd.split(' ')[1]);
        }
        
        return {
          type: 'error',
          message: `Unknown command: ${command}\nType /help for available commands`
        };
    }
  }

  // Get help text
  getHelp() {
    return {
      type: 'help',
      message: `🤖 Arrowhead Polaris Local Terminal

📦 Order Commands:
• /orders - View all pending orders
• /order [ID] - View specific order details
• /pick [ID] - Start picking an order

📊 Stock Commands:
• /stock [SKU] - Check stock for specific SKU
• /stock low - View low stock items

🔧 System Commands:
• /status - System status
• /stats - Warehouse statistics
• /clear - Clear terminal
• /help - Show this help

💡 You can also ask questions in plain English!`
    };
  }

  // Get orders list
  getOrdersList() {
    const orders = this.getOrders();
    
    if (orders.length === 0) {
      return {
        type: 'info',
        message: 'No pending orders at the moment.'
      };
    }
    
    const orderList = orders.slice(0, 5).map(order => 
      `• ${order.orderId} - ${order.customer} (${order.totalItems} items) [${order.priority.toUpperCase()}]`
    ).join('\n');
    
    return {
      type: 'orders',
      message: `Found ${orders.length} pending orders:\n${orderList}${orders.length > 5 ? '\n\n... and ' + (orders.length - 5) + ' more' : ''}`,
      data: orders
    };
  }

  // Get order detail
  getOrderDetail(orderId) {
    const orders = this.getOrders();
    const order = orders.find(o => o.orderId.toLowerCase() === orderId.toLowerCase());
    
    if (!order) {
      return {
        type: 'error',
        message: `Order ${orderId} not found`
      };
    }
    
    return {
      type: 'order_detail',
      message: `Order ${order.orderId}:
Customer: ${order.customer}
Items: ${order.totalItems}
Priority: ${order.priority}
Due: ${new Date(order.dueDate).toLocaleString()}

Items to pick:
${order.items.slice(0, 3).map(item => `• ${item.name} x${item.quantity}`).join('\n')}
${order.items.length > 3 ? `... and ${order.items.length - 3} more items` : ''}`,
      data: order
    };
  }

  // Get low stock list
  getLowStockList() {
    const lowStock = this.getLowStock();
    
    if (lowStock.length === 0) {
      return {
        type: 'info',
        message: 'All stock levels are healthy! No items are running low.'
      };
    }
    
    const stockList = lowStock.slice(0, 5).map(item => 
      `• ${item.id} - ${item.zone}: ${item.currentStock.reduce((sum, s) => sum + s.quantity, 0)} units`
    ).join('\n');
    
    return {
      type: 'stock_low',
      message: `Low stock items (${lowStock.length}):\n${stockList}${lowStock.length > 5 ? '\n\n... and ' + (lowStock.length - 5) + ' more' : ''}`,
      data: lowStock
    };
  }

  // Get stock detail
  getStockDetail(sku) {
    // Find in bins data
    const bin = binsData.bins.find(b => 
      b.currentStock.some(s => s.sku?.toLowerCase() === sku.toLowerCase())
    );
    
    if (!bin) {
      return {
        type: 'error',
        message: `SKU ${sku} not found in warehouse`
      };
    }
    
    const stock = bin.currentStock.find(s => s.sku?.toLowerCase() === sku.toLowerCase());
    
    return {
      type: 'stock_detail',
      message: `Stock for ${sku}:
Location: Zone ${bin.zone}, Bin ${bin.id}
Quantity: ${stock.quantity} units
Type: ${bin.type} storage
Capacity: ${bin.capacity} units`,
      data: { bin, stock }
    };
  }

  // Start picking
  startPicking(orderId) {
    const orders = this.getOrders();
    const order = orders.find(o => o.orderId.toLowerCase() === orderId.toLowerCase());
    
    if (!order) {
      return {
        type: 'error',
        message: `Order ${orderId} not found`
      };
    }
    
    return {
      type: 'action',
      message: `Starting picking process for order ${order.orderId}...
Navigate to the Picking module to begin.
Customer: ${order.customer}
Items: ${order.totalItems}`,
      data: { action: 'pick', order }
    };
  }

  // Get system status
  getSystemStatus() {
    const orders = this.getOrders();
    const lowStock = this.getLowStock();
    const totes = this.getTotes();
    
    return {
      type: 'status',
      message: `System Status: ✅ All Systems Operational

📦 Orders: ${orders.length} pending
📋 Totes: ${totes.length} ready for packing
⚠️ Low Stock Items: ${lowStock.length}
👥 Active Users: 3
🔌 Connection: Local Mode
⏱️ Response Time: <100ms`,
      data: {
        operational: true,
        orders: orders.length,
        totes: totes.length,
        lowStock: lowStock.length
      }
    };
  }

  // Get warehouse stats
  getWarehouseStats() {
    const orders = this.getOrders();
    const bins = binsData.bins;
    const totalItems = bins.reduce((sum, bin) => 
      sum + bin.currentStock.reduce((s, stock) => s + stock.quantity, 0), 0
    );
    
    return {
      type: 'stats',
      message: `📊 Warehouse Statistics:

Inventory:
• Total SKUs: ${bins.length}
• Total Items: ${totalItems.toLocaleString()}
• Storage Zones: ${[...new Set(bins.map(b => b.zone))].length}

Today's Activity:
• Orders Processed: 47
• Items Picked: 312
• Items Packed: 298
• Average Pick Time: 2.3 min/order

Performance:
• Accuracy Rate: 99.7%
• On-Time Delivery: 98.5%`,
      data: {
        skus: bins.length,
        totalItems,
        ordersToday: 47,
        accuracy: 99.7
      }
    };
  }

  // Helper methods
  getOrders() {
    // Get from local storage or use initial data
    const stored = localStorage.getItem('warehouse_orders');
    return stored ? JSON.parse(stored) : initialOrders;
  }

  getTotes() {
    const stored = localStorage.getItem('warehouse_totes');
    return stored ? JSON.parse(stored) : initialTotes;
  }

  getLowStock() {
    return binsData.bins.filter(bin => {
      const totalStock = bin.currentStock.reduce((sum, s) => sum + s.quantity, 0);
      return totalStock < bin.capacity * 0.3; // Less than 30% capacity
    });
  }

  // Disconnect (no-op for local)
  disconnect() {
    this.isConnected = false;
    this.notifyStatusChange(false);
  }

  // Connect (no-op for local)
  connect() {
    this.isConnected = true;
    this.notifyStatusChange(true);
  }
}

// Create singleton instance
const localTerminalConnector = new LocalTerminalConnector();

export default localTerminalConnector;