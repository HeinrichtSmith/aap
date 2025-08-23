import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Bell,
  Truck,
  PackageCheck,
  PackageOpen,
  Activity,
  Award,
  Clock
} from 'lucide-react';

const NotificationsPanel = ({ isOpen, onClose, notifications = [], clearNotification, clearAllNotifications }) => {
  const [filter, setFilter] = useState('all');
  
  const getIcon = (type) => {
    switch (type) {
      case 'order': return Package;
      case 'picking': return Package;
      case 'packing': return PackageCheck;
      case 'shipping': return Truck;
      case 'receiving': return PackageOpen;
      case 'achievement': return Award;
      case 'success': return CheckCircle;
      case 'alert': case 'warning': return AlertCircle;
      case 'activity': return Activity;
      default: return Bell;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'order': case 'picking': return 'text-blue-400';
      case 'packing': return 'text-purple-400';
      case 'shipping': return 'text-green-400';
      case 'receiving': return 'text-cyan-400';
      case 'achievement': return 'text-yellow-400';
      case 'success': return 'text-green-500';
      case 'alert': case 'warning': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'order': case 'picking': return 'bg-blue-500/10';
      case 'packing': return 'bg-purple-500/10';
      case 'shipping': return 'bg-green-500/10';
      case 'receiving': return 'bg-cyan-500/10';
      case 'achievement': return 'bg-yellow-500/10';
      case 'success': return 'bg-green-500/10';
      case 'alert': case 'warning': return 'bg-red-500/10';
      default: return 'bg-gray-500/10';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const date = new Date(timestamp);
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => {
        if (filter === 'order') return ['order', 'picking', 'packing', 'shipping'].includes(n.type);
        if (filter === 'alert') return ['alert', 'warning'].includes(n.type);
        return n.type === filter;
      });

  const notificationCounts = {
    all: notifications.length,
    order: notifications.filter(n => ['order', 'picking', 'packing', 'shipping'].includes(n.type)).length,
    achievement: notifications.filter(n => n.type === 'achievement').length,
    alert: notifications.filter(n => ['alert', 'warning'].includes(n.type)).length
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-800 shadow-2xl z-50"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Bell size={24} className="text-white" />
                  </motion.div>
                  <h2 className="text-sm font-bold text-white">Notifications</h2>
                  {notifications.length > 0 && (
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'order', label: 'Orders' },
                  { key: 'achievement', label: 'Achievements' },
                  { key: 'alert', label: 'Alerts' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filter === tab.key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {tab.label}
                    {notificationCounts[tab.key] > 0 && (
                      <span className="ml-1.5 text-xs">
                        ({notificationCounts[tab.key]})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto h-[calc(100%-180px)]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-8">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-gray-600 mb-4"
                  >
                    <Bell size={48} />
                  </motion.div>
                  <p className="text-gray-500 text-center">
                    {filter === 'all' 
                      ? 'No notifications yet' 
                      : `No ${filter} notifications`}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map((notification, index) => {
                      const Icon = getIcon(notification.type);
                      const isNew = Date.now() - new Date(notification.timestamp).getTime() < 60000;
                      
                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, x: 50, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -50, scale: 0.9 }}
                          transition={{ delay: index * 0.05 }}
                          className={`relative p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-all group ${getBgColor(notification.type)}`}
                        >
                          {/* New indicator */}
                          {isNew && (
                            <motion.div
                              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                          
                          <div className="flex items-start space-x-3">
                            <motion.div 
                              className={`${getIconColor(notification.type)} mt-0.5`}
                              whileHover={{ scale: 1.2, rotate: 360 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Icon size={20} />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-sm">
                                {notification.title}
                              </h3>
                              <p className="text-xs text-gray-400 mt-1 break-words">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-500">
                                  {formatTimeAgo(notification.timestamp)}
                                </p>
                                {notification.actionLabel && (
                                  <button className="text-xs text-blue-400 hover:text-blue-300">
                                    {notification.actionLabel} →
                                  </button>
                                )}
                              </div>
                            </div>
                            {/* Dismiss button */}
                            <button
                              onClick={() => clearNotification?.(notification.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded"
                            >
                              <X size={14} className="text-gray-500" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={clearAllNotifications}
                  className="w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;