// 🎯 Arrowhead WMS - Component Template
// Use this template for creating new components that follow project standards

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  // Import only the icons you need
  Package,
  CheckCircle,
  AlertCircle,
  // Add more icons as needed
} from 'lucide-react';
import { useWarehouse } from '../hooks/useWarehouseContext';
import { playSound } from '../utils/audio';
import GameIcon from './GameIcon';
import { toast } from 'react-hot-toast';

// 🎨 Animation variants following project standards
const componentVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.95,
    y: 20 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: -20,
    transition: {
      duration: 0.2
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

// 🎮 Button variants for consistent styling
const buttonVariants = {
  primary: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-200",
  secondary: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-gray-500/25 transition-all duration-200",
  success: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-green-500/25 transition-all duration-200",
  warning: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-orange-500/25 transition-all duration-200",
  danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-red-500/25 transition-all duration-200",
  ghost: "bg-transparent hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-lg border border-white/20 transition-all duration-200"
};

/**
 * ComponentName - Brief description of what this component does
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - The title of the component
 * @param {Array} props.items - Array of items to display
 * @param {Function} props.onItemClick - Callback when item is clicked
 * @param {boolean} props.loading - Loading state
 * @param {string} props.variant - Visual variant ('primary', 'secondary', etc.)
 * @param {Function} props.onClose - Callback when component should close
 */
const ComponentName = ({ 
  title = "Default Title",
  items = [],
  onItemClick,
  loading = false,
  variant = "primary",
  onClose,
  // Add more props as needed
}) => {
  // 🏭 Warehouse context for global state
  const { user, addXP, playSound: contextPlaySound } = useWarehouse();
  
  // 📊 Local state management
  const [selectedItem, setSelectedItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // 🎯 Memoized values for performance
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      // Add any processing logic here
    }));
  }, [items]);
  
  const totalItems = useMemo(() => {
    return processedItems.length;
  }, [processedItems]);
  
  // 🎮 Event handlers with sound feedback
  const handleItemClick = useCallback((item) => {
    if (isProcessing) return;
    
    setSelectedItem(item);
    contextPlaySound('click');
    
    if (onItemClick) {
      onItemClick(item);
    }
    
    // Award XP for interaction if applicable
    if (user) {
      addXP(5, `Interacted with ${item.name || 'item'}`);
    }
  }, [isProcessing, onItemClick, contextPlaySound, user, addXP]);
  
  const handleConfirm = useCallback(async () => {
    if (!selectedItem || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      contextPlaySound('success');
      toast.success(`Successfully processed ${selectedItem.name || 'item'}`);
      
      // Award XP for successful action
      if (user) {
        addXP(25, `Completed ${title} action`);
      }
      
      setSelectedItem(null);
    } catch (err) {
      setError(err.message);
      contextPlaySound('error');
      toast.error('Operation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedItem, isProcessing, contextPlaySound, user, addXP, title]);
  
  const handleCancel = useCallback(() => {
    setSelectedItem(null);
    setError(null);
    contextPlaySound('click');
    
    if (onClose) {
      onClose();
    }
  }, [onClose, contextPlaySound]);
  
  // 🎨 Loading state
  if (loading) {
    return (
      <motion.div
        variants={componentVariants}
        initial="initial"
        animate="animate"
        className="glass-card p-6"
      >
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white">Loading...</span>
        </div>
      </motion.div>
    );
  }
  
  // 🎯 Error state
  if (error) {
    return (
      <motion.div
        variants={componentVariants}
        initial="initial"
        animate="animate"
        className="glass-card p-6 border border-red-500/50"
      >
        <div className="flex items-center space-x-3 text-red-400">
          <AlertCircle size={24} />
          <div>
            <h3 className="font-semibold">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={handleCancel}
          className={buttonVariants.secondary + " mt-4"}
        >
          Try Again
        </button>
      </motion.div>
    );
  }
  
  // 🎮 Main component render
  return (
    <motion.div
      variants={componentVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-gray-400">{totalItems} items available</p>
          </div>
        </div>
        
        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </motion.button>
        )}
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        {processedItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-400">No items available</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {processedItems.map((item, index) => (
              <motion.div
                key={item.id || index}
                variants={componentVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => handleItemClick(item)}
                className={`glass-card p-4 cursor-pointer transition-all duration-200 ${
                  selectedItem?.id === item.id 
                    ? 'ring-2 ring-blue-500 bg-blue-500/10' 
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <GameIcon
                    type={item.iconType || 'box'}
                    size="md"
                    quantity={item.quantity || 1}
                    animated={selectedItem?.id === item.id}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                  {item.quantity && (
                    <div className="text-right">
                      <span className="text-lg font-bold text-white">{item.quantity}</span>
                      <p className="text-xs text-gray-400">units</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex space-x-3 mt-6 pt-6 border-t border-white/10"
        >
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`${buttonVariants.success} flex-1 ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle size={16} />
                <span>Confirm</span>
              </div>
            )}
          </button>
          
          <button
            onClick={handleCancel}
            className={buttonVariants.secondary}
          >
            Cancel
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ComponentName; 