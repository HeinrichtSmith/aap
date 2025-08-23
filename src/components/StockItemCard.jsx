import React from 'react';
import { motion } from 'framer-motion';
import GameIcon from './GameIcon';
import { useWarehouse } from '../hooks/useWarehouseContext';

const StockItemCard = ({ item, isSelected, onSelect, stockLevel }) => {
  const { playSound } = useWarehouse();

  // Get stock level styling
  const getStockLevelStyle = (level) => {
    switch (level) {
      case 'out':
        return {
          color: 'text-red-400',
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          label: 'Out of Stock',
          tier: 'epic'
        };
      case 'low':
        return {
          color: 'text-purple-400',
          bg: 'bg-purple-500/20',
          border: 'border-purple-500/30',
          label: 'Low Stock',
          tier: 'rare'
        };
      default:
        return {
          color: 'text-green-400',
          bg: 'bg-green-500/20',
          border: 'border-green-500/30',
          label: 'In Stock',
          tier: 'common'
        };
    }
  };

  // Get GameIcon tier based on quantity
  const getIconTier = (quantity) => {
    if (quantity === 0) return 'epic';
    if (quantity <= 20) return 'rare';
    if (quantity <= 100) return 'common';
    return 'legendary';
  };

  const stockStyle = getStockLevelStyle(stockLevel);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ 
        scale: 1.02, 
        x: 5,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        onSelect();
        playSound('hover');
      }}
      onHoverStart={() => playSound('hover')}
      className={`
        p-4 rounded-2xl border cursor-pointer transition-all duration-300
        ${isSelected 
          ? 'bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/10' 
          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
        }
      `}
    >
      <div className="flex items-center space-x-4">
        {/* GameIcon */}
        <motion.div
          animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <GameIcon
            iconType={item.icon}
            size={40}
            tier={getIconTier(item.quantity)}
            quantity={item.quantity}
            animated={true}
          />
        </motion.div>

        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{item.name}</h3>
              <p className="text-sm text-gray-400 font-mono">{item.id}</p>
            </div>
            
            {/* Quantity */}
            <div className="text-right ml-3">
              <div className="text-lg font-bold text-white">{item.quantity}</div>
            </div>
          </div>

          {/* Stock Level Indicator */}
          <div className="flex items-center justify-between mt-3">
            <span className={`
              text-xs px-2 py-1 rounded-full font-medium border
              ${stockStyle.color} ${stockStyle.bg} ${stockStyle.border}
            `}>
              {stockStyle.label}
            </span>
            
            {/* Location */}
            <span className="text-xs text-gray-500 truncate ml-2">
              {item.location}
            </span>
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"
          />
        )}
      </div>

      {/* Active Border */}
      {isSelected && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-2xl"
          style={{ originX: 0 }}
        />
      )}
    </motion.div>
  );
};

export default StockItemCard; 