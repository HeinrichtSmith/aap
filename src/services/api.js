const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Normalize order data to ensure frontend compatibility
 * - Adds derived fields for backward compatibility
 * - Adds defaults for missing values
 * - Normalizes item data
 * @param {Object} order - Raw order from API
 * @returns {Object} - Normalized order
 */
function normalizeOrder(order) {
  if (!order) return order;

  return {
    ...order,
    // Add derived field for backward compatibility (convert minutes to seconds)
    estimatedTime: (order.estimatedPickMinutes || 10) * 60,
    // Ensure order ID exists
    id: order.id || order.orderId,
    // FIX: Explicitly preserve SO number for human-readable display
    soNumber: order.id || order.soNumber || order.salesOrderNumber || order.orderId,
    // Normalize items - ensure barcode from backend product relation is preserved
    items: (order.items || []).map(item => ({
      ...item,
      // Add binLocation alias
      binLocation: item.location || 'UNKNOWN',
      // Ensure item has required fields
      id: item.id,
      sku: item.sku || 'UNKNOWN',
      name: item.name || 'Unknown Item',
      quantity: item.quantity || 0,
      // CRITICAL FIX: Use barcode from backend if available, fallback to SKU, never use UUID
      barcode: item.barcode || item.sku || 'UNKNOWN',
    })),
    // Normalize customer info
    customer: order.customerName || order.customer || 'Unknown',
    // Normalize dates
    dueDate: order.dueDate || order.requiredBy || order.createdAt,
  };
}

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Auth API
export const authAPI = {
  async login(email, password) {
    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }
};

// Orders API
export const ordersAPI = {
  async getAll() {
    const response = await apiCall('/orders');
    const orders = response.orders || response;
    // Normalize all orders for frontend compatibility
    return Array.isArray(orders) ? orders.map(normalizeOrder) : orders;
  },
  
  async getById(id) {
    const response = await apiCall(`/orders/${id}`);
    const order = response.order || response;
    // Normalize order for frontend compatibility
    return order ? normalizeOrder(order) : order;
  },
  
  async updateStatus(id, status) {
    return apiCall(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
  
  async getByStatus(status) {
    const response = await apiCall(`/orders?status=${status}`);
    const orders = response.orders || response;
    // Normalize all orders for frontend compatibility
    return Array.isArray(orders) ? orders.map(normalizeOrder) : orders;
  },
  
  async getAvailable() {
    const response = await apiCall('/orders?status=PENDING,PICKING');
    const orders = response.orders || response;
    // Normalize all orders for frontend compatibility
    return Array.isArray(orders) ? orders.map(normalizeOrder) : orders;
  },

  async pickItem(orderId, itemId, quantity, binLocation) {
    const response = await apiCall(`/orders/${orderId}/pick`, {
      method: 'POST',
      body: JSON.stringify({ itemId, quantity, binLocation }),
    });
    return response;
  }
};

// Products API
export const productsAPI = {
  async getAll() {
    return apiCall('/products');
  },
  
  async getById(id) {
    return apiCall(`/products/${id}`);
  },
  
  async search(query) {
    return apiCall(`/products/search?q=${encodeURIComponent(query)}`);
  },
  
  async getBySku(sku) {
    return apiCall(`/products/sku/${encodeURIComponent(sku)}`);
  }
};

// Inventory API
export const inventoryAPI = {
  async getAll() {
    return apiCall('/inventory');
  },
  
  async getByBin(binId) {
    return apiCall(`/inventory/bin/${binId}`);
  },
  
  async update(id, data) {
    return apiCall(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
};

// Users API
export const usersAPI = {
  async getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },
  
  async getStats(userId) {
    return apiCall(`/users/${userId}/stats`);
  }
};

// Dashboard API
export const dashboardAPI = {
  async getStats() {
    return apiCall('/dashboard/stats');
  },
  
  async getRecentActivity() {
    return apiCall('/dashboard/activity');
  }
};

export default {
  auth: authAPI,
  orders: ordersAPI,
  products: productsAPI,
  inventory: inventoryAPI,
  users: usersAPI,
  dashboard: dashboardAPI,
};