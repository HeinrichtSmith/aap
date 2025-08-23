import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Barcode, User, Calendar, Play, ArrowRight, 
  Search, Clock, TrendingUp
} from 'lucide-react';
import PriorityBadge from '../PriorityBadge';
import GameIcon from '../GameIcon';
import { playSound, initializeAudio, isAudioInitialized } from '../../utils/audio';
import { formatDate } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';

// Helper function to determine icon type based on item (same as ToteSelectionScreen)
// Use central icon mapping function
import { getItemIconType } from '../../config/gameIconConstants';

// Helper function to determine the most representative icon type for an order
const getOrderIconType = (order) => {
  if (!order.items || order.items.length === 0) return 'box';
  
  // Find the icon type that appears most frequently in the order
  const iconCounts = {};
  
  order.items.forEach(item => {
    const iconType = getItemIconType(item.name, item.sku || item.id);
    iconCounts[iconType] = (iconCounts[iconType] || 0) + item.quantity;
  });
  
  // Return the icon type with the highest quantity
  const mostCommonIcon = Object.entries(iconCounts).reduce((a, b) => 
    iconCounts[a[0]] > iconCounts[b[0]] ? a : b
  )[0];
  
  return mostCommonIcon;
};

const OrderSelectionScreen = memo(({ orders, onSelectOrder }) => {
  const [audioStatus, setAudioStatus] = useState('not-initialized');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Immediate audio initialization on component mount
  useEffect(() => {
    // Don't try to initialize audio immediately - wait for user gesture
    const handleInteraction = async (e) => {
      // Prevent event from being handled multiple times
      if (isAudioInitialized()) return;
      
      console.log('User interaction detected, initializing audio...');
      
      // Initialize audio
      const success = await initializeAudio();
      if (success) {
        setAudioStatus('initialized');
        // Don't play a test sound here - let the actual interaction sound play
      } else {
        setAudioStatus('failed');
      }
      
      // Remove all listeners after first interaction
      document.removeEventListener('click', handleInteraction, true);
      document.removeEventListener('touchstart', handleInteraction, true);
      document.removeEventListener('keydown', handleInteraction, true);
    };
    
    // Check if audio is already initialized
    if (isAudioInitialized()) {
      setAudioStatus('initialized');
    } else {
      // Listen for user interaction with capture phase to ensure we get it first
      document.addEventListener('click', handleInteraction, true);
      document.addEventListener('touchstart', handleInteraction, true);
      document.addEventListener('keydown', handleInteraction, true);
    }
    
    return () => {
      // Cleanup listeners on unmount
      document.removeEventListener('click', handleInteraction, true);
      document.removeEventListener('touchstart', handleInteraction, true);
      document.removeEventListener('keydown', handleInteraction, true);
    };
  }, []);

  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 'urgent': 
        return 'from-red-500/20 to-red-600/10';
      case 'overnight': 
        return 'from-orange-500/20 to-orange-600/10';
      default: 
        return 'from-blue-500/20 to-blue-600/10';
    }
  }, []);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const priorityOrder = { urgent: 0, overnight: 1, normal: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [orders]);

  // Filter orders based on debounced search query
  const filteredOrders = useMemo(() => {
    if (!debouncedSearchQuery) return sortedOrders;
    const query = debouncedSearchQuery.toLowerCase();
    return sortedOrders.filter(order => (
      order.orderId.toLowerCase().includes(query) ||
      order.customer.toLowerCase().includes(query) ||
      order.items.some(item => item.name.toLowerCase().includes(query))
    ));
  }, [sortedOrders, debouncedSearchQuery]);

  // Format estimated time to minutes:seconds
  const formatEstimatedTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Audio status indicator */}
      {audioStatus !== 'initialized' && (
        <div className="fixed top-4 right-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 text-yellow-300 text-sm z-50">
          🔇 Click anywhere to enable sound effects
        </div>
      )}
      
      
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Package className="text-blue-400 mr-3" size={48} />
          <h1 className="text-6xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Pick Orders
          </h1>
        </div>
        <p className="text-xl text-gray-400 flex items-center justify-center">
          <Package className="mr-2" size={20} />
          Select an order to begin picking items from the warehouse
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by order number, customer, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl text-white placeholder-gray-400 outline-none transition-all duration-200"
          />
        </div>
      </div>

      
      {/* Order Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-[2400px] mx-auto">
        {filteredOrders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { delay: index * 0.05 }
            }}
            whileHover={{ scale: 1.02, y: -4, transition: { type: "spring", stiffness: 600, damping: 20 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onSelectOrder(order);
              playSound('complete');
            }}
            onMouseEnter={() => playSound('hover')}
            className="group cursor-pointer"
          >
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-6 h-full hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:border-blue-500/50 border border-gray-800 relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${getPriorityColor(order.priority)} opacity-50`} />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/5 group-hover:to-blue-500/10 rounded-3xl transition-all duration-500" />
              
              <div className="relative">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors flex items-center justify-center">
                    <Barcode className="mr-2" size={24} />
                    {order.orderId}
                  </h2>
                  <p className="text-sm text-gray-600 flex items-center justify-center">
                    <User className="mr-1" size={14} />
                    {order.customer}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 flex items-center justify-center">
                    <Calendar className="mr-1" size={12} />
                    Due: {formatDate(order.dueDate)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 flex items-center justify-center">
                    <Clock className="mr-1" size={12} />
                    Est: {formatEstimatedTime(order.estimatedTime)}
                  </p>
                </div>
                
                <div className="space-y-2 mb-4">
                  {order.items.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-gray-800/50 last:border-0 group-hover:border-gray-700/50 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-300 group-hover:text-gray-200 transition-colors truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-600 group-hover:text-gray-500 transition-colors flex items-center">
                          <Barcode className="mr-1 flex-shrink-0" size={12} />
                          <span className="truncate">{item.id}</span>
                        </p>
                      </div>
                      <span className="font-bold text-gray-400 ml-2 group-hover:text-gray-300 transition-colors">
                        ×{item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{order.items.length - 3} more items
                    </p>
                  )}
                </div>

                <div className="flex justify-center mb-4">
                  <PriorityBadge priority={order.priority} />
                </div>
                
                <div className="flex justify-center mb-4">
                  <GameIcon
                    iconType={getOrderIconType(order)}
                    actualQuantity={order.totalItems}
                    size={40}
                    iconSize="medium"
                    showBadge={true}
                  />
                </div>
                
                {/* Progress Indicator for partially picked orders */}
                {order.pickedItems > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Progress</span>
                      <span className="text-xs font-bold text-blue-400">
                        {Math.round((order.pickedItems / order.totalItems) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                        style={{ width: `${(order.pickedItems / order.totalItems) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <Play className="animate-pulse" size={16} />
                    <span className="font-semibold text-sm">Start Picking</span>
                    <ArrowRight className="transform group-hover:translate-x-2 transition-transform" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state if no orders match search */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto text-gray-600 mb-4" size={64} />
          <p className="text-xl text-gray-400">No orders found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-blue-400 hover:text-blue-300 transition-colors"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
});

OrderSelectionScreen.displayName = 'OrderSelectionScreen';

export default OrderSelectionScreen;