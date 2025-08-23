import React, { memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Import only the icons we actually use
import { 
  CheckCircle,
  Barcode,
  MapPin,
  Minus,
  Plus,
  Check,
  AlertTriangle
} from 'lucide-react';
import ProgressRing from '../ProgressRing.jsx';

const PackingItem = memo(({ 
  item, 
  scannedCount, 
  isSelected, 
  isFullyScanned, 
  isPartiallyScanned,
  editingQuantity,
  tempQuantity,
  removedItemId,
  onItemClick,
  onAddItem,
  onReduceItem,
  onQuantityClick,
  onQuantitySave,
  onQuantityCancel,
  onTempQuantityChange,
  playSound
}) => {
  const handleClick = useCallback(() => {
    onItemClick(item.id);
  }, [item.id, onItemClick]);

  const handleAddClick = useCallback((e) => {
    e.stopPropagation();
    onAddItem(item.id, e);
  }, [item.id, onAddItem]);

  const handleReduceClick = useCallback((e) => {
    e.stopPropagation();
    onReduceItem(item.id, e);
  }, [item.id, onReduceItem]);

  const handleQuantityClick = useCallback((e) => {
    e.stopPropagation();
    onQuantityClick(item.id, e);
  }, [item.id, onQuantityClick]);

  const handleQuantitySave = useCallback((e) => {
    e.stopPropagation();
    onQuantitySave(item.id, e);
  }, [item.id, onQuantitySave]);

  const handleMouseEnter = useCallback(() => {
    playSound('hover');
  }, [playSound]);

  const progressPercentage = useMemo(() => {
    return (scannedCount / item.quantity) * 100;
  }, [scannedCount, item.quantity]);

  const itemClasses = useMemo(() => {
    const baseClasses = "relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer group";
    
    if (isSelected) {
      return `${baseClasses} bg-blue-900/30 border-blue-500/70 shadow-lg shadow-blue-500/20`;
    }
    if (isFullyScanned) {
      return `${baseClasses} bg-green-900/20 border-green-500/50 hover:border-green-400/50`;
    }
    if (isPartiallyScanned) {
      return `${baseClasses} bg-yellow-900/20 border-yellow-500/50 hover:border-yellow-400/50`;
    }
    return `${baseClasses} bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-blue-500/50`;
  }, [isSelected, isFullyScanned, isPartiallyScanned]);

  const progressBarClasses = useMemo(() => {
    if (isFullyScanned) {
      return 'bg-gradient-to-r from-green-400 to-green-500';
    }
    if (isPartiallyScanned) {
      return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    }
    return 'bg-gradient-to-r from-blue-400 to-blue-500';
  }, [isFullyScanned, isPartiallyScanned]);

  const quantityTextClasses = useMemo(() => {
    if (isFullyScanned) return 'text-green-400';
    if (isPartiallyScanned) return 'text-yellow-400';
    return 'text-white';
  }, [isFullyScanned, isPartiallyScanned]);

  return (
    <motion.div
      onClick={handleClick}
      className={itemClasses}
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.95 }}
      style={{ willChange: 'transform' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      layout
    >
      <div className="absolute bottom-4 right-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
        <span className="text-sm font-bold text-blue-300 flex items-center">
          <MapPin className="mr-1" size={14} />
          {item.binLocation}
        </span>
      </div>
      
      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div className={`flex-1 ${isFullyScanned ? 'opacity-60' : ''}`}>
            <p className={`font-bold text-2xl mb-2 text-white ${isFullyScanned ? 'line-through' : ''}`}>
              {item.name}
            </p>
            <p className="text-base text-gray-400 flex items-center">
              <Barcode className="mr-1" size={16} />
              {item.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between relative">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <ProgressRing 
                progress={scannedCount / item.quantity} 
                size={60} 
                strokeWidth={4}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {editingQuantity === item.id ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={tempQuantity}
                      onChange={(e) => onTempQuantityChange(e.target.value)}
                      className="w-8 h-6 px-1 bg-gray-800 border border-blue-500 rounded text-white text-center outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      min="0"
                      max={item.quantity}
                      autoFocus
                    />
                    <button
                      onClick={handleQuantitySave}
                      className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 flex items-center justify-center"
                    >
                      <Check size={8} />
                    </button>
                    <button
                      onClick={onQuantityCancel}
                      className="w-4 h-4 rounded bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 flex items-center justify-center"
                    >
                      <AlertTriangle size={8} />
                    </button>
                  </div>
                ) : (
                  <span 
                    onClick={handleQuantityClick}
                    className={`text-lg font-bold cursor-pointer hover:scale-110 transition-transform ${quantityTextClasses}`}
                  >
                    {scannedCount}/{item.quantity}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {scannedCount > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleReduceClick}
                  className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/50 rounded-xl p-3 transition-all duration-300 hover:scale-110 relative z-20 cursor-pointer min-w-[56px] min-h-[56px] flex items-center justify-center"
                  onMouseEnter={handleMouseEnter}
                  title="Remove one item"
                  type="button"
                >
                  <Minus className="text-purple-400 pointer-events-none" size={28} />
                </motion.button>
              )}
              
              <AnimatePresence mode="wait">
                {scannedCount < item.quantity && (
                  <motion.button
                    key={`plus-button-${item.id}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={handleAddClick}
                    onMouseEnter={handleMouseEnter}
                    className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/50 rounded-xl p-3 transition-all duration-300 relative z-20 cursor-pointer min-w-[56px] min-h-[56px] flex items-center justify-center"
                    title="Add one item"
                    type="button"
                  >
                    <Plus className="text-blue-400 pointer-events-none" size={28} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {isFullyScanned && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-green-400 to-green-500 rounded-full p-3 shadow-lg shadow-green-500/50"
            >
              <CheckCircle className="text-white" size={24} />
            </motion.div>
          )}
        </div>
        
        <div className="mt-6 h-2 bg-white/10 rounded-full relative overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${progressBarClasses}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
});

PackingItem.displayName = 'PackingItem';

export default PackingItem;