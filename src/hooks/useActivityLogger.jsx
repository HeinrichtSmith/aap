// hooks/useActivityLogger.js
import { useWarehouse } from './useWarehouseContext';

export const useActivityLogger = () => {
  const { user } = useWarehouse();

  const logActivity = (action, details) => {
    try {
      const activities = JSON.parse(localStorage.getItem('warehouseActivities') || '[]');
      
      const newActivity = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user: details.user || user?.name || 'System',
        action,
        item: details.item,
        itemDetails: details.itemDetails || '',
        timestamp: new Date().toISOString(),
        type: details.type || 'general',
        location: details.location || '',
        priority: details.priority || 'normal'
      };
      
      // Add to beginning of array (most recent first)
      activities.unshift(newActivity);
      
      // Keep only last 50 activities
      const trimmedActivities = activities.slice(0, 50);
      
      // Save to localStorage
      localStorage.setItem('warehouseActivities', JSON.stringify(trimmedActivities));
      
      // Trigger storage event for other tabs/components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'warehouseActivities',
        newValue: JSON.stringify(trimmedActivities),
        url: window.location.href
      }));
      
      // Also dispatch a custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('warehouseActivityUpdate', {
        detail: newActivity
      }));
      
      return newActivity;
    } catch (error) {
      console.error('Failed to log activity:', error);
      return null;
    }
  };

  const getRecentActivities = (limit = 10) => {
    try {
      const activities = JSON.parse(localStorage.getItem('warehouseActivities') || '[]');
      return activities.slice(0, limit);
    } catch (error) {
      console.error('Failed to get activities:', error);
      return [];
    }
  };

  const clearOldActivities = (hoursToKeep = 24) => {
    try {
      const activities = JSON.parse(localStorage.getItem('warehouseActivities') || '[]');
      const cutoffTime = new Date(Date.now() - hoursToKeep * 60 * 60 * 1000);
      
      const filteredActivities = activities.filter(activity => 
        new Date(activity.timestamp) > cutoffTime
      );
      
      localStorage.setItem('warehouseActivities', JSON.stringify(filteredActivities));
      return filteredActivities.length;
    } catch (error) {
      console.error('Failed to clear old activities:', error);
      return 0;
    }
  };

  return {
    logActivity,
    getRecentActivities,
    clearOldActivities
  };
};

// Activity types and their configurations
export const ACTIVITY_TYPES = {
  PICKING: {
    type: 'picking',
    icon: '📦',
    color: 'text-blue-400'
  },
  PACKING: {
    type: 'packing',
    icon: '📋',
    color: 'text-yellow-400'
  },
  SHIPPING: {
    type: 'shipping',
    icon: '🚚',
    color: 'text-green-400'
  },
  RECEIVING: {
    type: 'receiving',
    icon: '📥',
    color: 'text-purple-400'
  },
  STOCK_COUNT: {
    type: 'stockcount',
    icon: '📊',
    color: 'text-orange-400'
  },
  TRANSFER: {
    type: 'transfer',
    icon: '🔄',
    color: 'text-cyan-400'
  },
  ADJUSTMENT: {
    type: 'adjustment',
    icon: '✏️',
    color: 'text-red-400'
  },
  LOGIN: {
    type: 'login',
    icon: '👤',
    color: 'text-gray-400'
  },
  SYSTEM: {
    type: 'system',
    icon: '⚙️',
    color: 'text-gray-500'
  }
};

// Predefined activity messages for consistency
export const ACTIVITY_MESSAGES = {
  // Picking activities
  startedPicking: (orderId, itemCount) => ({
    action: 'started picking',
    item: orderId,
    itemDetails: `${itemCount} items`,
    type: ACTIVITY_TYPES.PICKING.type
  }),
  
  pickedItem: (sku, quantity, location) => ({
    action: 'picked',
    item: `${quantity} x ${sku}`,
    itemDetails: `from ${location}`,
    type: ACTIVITY_TYPES.PICKING.type
  }),
  
  completedPicking: (orderId, itemCount, duration) => ({
    action: 'completed picking',
    item: orderId,
    itemDetails: `${itemCount} items in ${duration}s`,
    type: ACTIVITY_TYPES.PICKING.type
  }),
  
  // Packing activities
  startedPacking: (orderId, itemCount) => ({
    action: 'started packing',
    item: orderId,
    itemDetails: `${itemCount} items`,
    type: ACTIVITY_TYPES.PACKING.type
  }),
  
  verifiedItems: (orderId, itemCount) => ({
    action: 'verified all items',
    item: orderId,
    itemDetails: `${itemCount} items checked`,
    type: ACTIVITY_TYPES.PACKING.type
  }),
  
  selectedPackage: (orderId, packageType) => ({
    action: 'selected package',
    item: orderId,
    itemDetails: packageType,
    type: ACTIVITY_TYPES.PACKING.type
  }),
  
  completedPacking: (orderId, packageType) => ({
    action: 'packed',
    item: orderId,
    itemDetails: packageType,
    type: ACTIVITY_TYPES.PACKING.type
  }),
  
  // Shipping activities
  shipped: (orderId, carrier) => ({
    action: 'shipped',
    item: orderId,
    itemDetails: `via ${carrier}`,
    type: ACTIVITY_TYPES.SHIPPING.type
  }),
  
  printedLabel: (orderId, trackingNumber) => ({
    action: 'printed shipping label',
    item: orderId,
    itemDetails: `Tracking: ${trackingNumber}`,
    type: ACTIVITY_TYPES.SHIPPING.type
  }),
  
  // Receiving activities
  receivedPO: (poNumber, itemCount, supplier) => ({
    action: 'received',
    item: poNumber,
    itemDetails: `${itemCount} items from ${supplier}`,
    type: ACTIVITY_TYPES.RECEIVING.type
  }),
  
  putAway: (sku, quantity, location) => ({
    action: 'put away',
    item: `${quantity} x ${sku}`,
    itemDetails: `to ${location}`,
    type: ACTIVITY_TYPES.RECEIVING.type
  }),
  
  // Stock control activities
  startedStockCount: (zone) => ({
    action: 'started stock count',
    item: zone,
    itemDetails: '',
    type: ACTIVITY_TYPES.STOCK_COUNT.type
  }),
  
  completedStockCount: (zone, accuracy) => ({
    action: 'completed stock count',
    item: zone,
    itemDetails: `${accuracy}% accuracy`,
    type: ACTIVITY_TYPES.STOCK_COUNT.type
  }),
  
  adjustedStock: (sku, adjustment, reason) => ({
    action: 'adjusted stock',
    item: sku,
    itemDetails: `${adjustment > 0 ? '+' : ''}${adjustment} units - ${reason}`,
    type: ACTIVITY_TYPES.ADJUSTMENT.type
  }),
  
  transferredStock: (sku, quantity, fromLoc, toLoc) => ({
    action: 'transferred',
    item: `${quantity} x ${sku}`,
    itemDetails: `${fromLoc} → ${toLoc}`,
    type: ACTIVITY_TYPES.TRANSFER.type
  }),
  
  // System activities
  userLogin: (username) => ({
    action: 'logged in',
    item: username,
    itemDetails: '',
    type: ACTIVITY_TYPES.LOGIN.type,
    user: username
  }),
  
  userLogout: (username) => ({
    action: 'logged out',
    item: username,
    itemDetails: '',
    type: ACTIVITY_TYPES.LOGIN.type,
    user: username
  }),
  
  systemAlert: (alertType, message) => ({
    action: alertType,
    item: 'System Alert',
    itemDetails: message,
    type: ACTIVITY_TYPES.SYSTEM.type,
    user: 'System'
  })
};

// Helper function to format activity for display
export const formatActivity = (activity) => {
  const config = Object.values(ACTIVITY_TYPES).find(t => t.type === activity.type) || ACTIVITY_TYPES.SYSTEM;
  
  return {
    ...activity,
    icon: config.icon,
    color: config.color,
    formattedTime: formatTimeAgo(activity.timestamp)
  };
};

// Helper function to format time ago
export const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = Math.floor((now - time) / 1000); // seconds
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
};

export default useActivityLogger;