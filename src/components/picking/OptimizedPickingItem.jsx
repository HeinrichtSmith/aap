import React, { memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  ScanLine, 
  Barcode, 
  MapPin, 
  Minus, 
  Plus, 
  Navigation,
  Edit3,
  X
} from 'lucide-react';
import ProgressRing from '../ProgressRing';
import GameIcon from '../GameIcon';
import { getItemIconType } from '../../config/gameIconConstants';
import { playSound } from '../../utils/audio';
import { useTierSystem } from '../../hooks/useTierSystem';

const OptimizedPickingItem = memo(({ 
  item, 
  pickedCount,
  isSelected,
  isFullyPicked,
  isPartiallyPicked,
  isNextToPick,
  hasAnimated,
  index,
  removedItemId,
  pickedItemId,
  editingQuantity,
  tempQuantity,
  isDragging = false,
  onItemClick,
  onAddItem,
  onRemoveItem,
  onEditQuantity,
  onTempQuantityChange,
  onEditingRef,
  isMinimized = false,
  isCompact = false,
  sectionId = null,
  onMouseDown
}) => {
  // Helper function to format bin location
  const formatBinLocation = (binLocation) => {
    if (!binLocation) return '';
    // Convert format from "A-01-02" to "A1"
    const match = binLocation.match(/^([A-Z])-0*(\d+)-0*(\d+)$/);
    if (match) {
      const [, zone, row, shelf] = match;
      return `${zone}${row}`;
    }
    return binLocation;
  };

  // Memoize card styling classes (use temp quantity in edit mode)
  const cardClasses = useMemo(() => {
    // Determine current state based on edit mode
    const currentCount = editingQuantity === item.id ? 
      (parseInt(tempQuantity) || 0) : 
      pickedCount;
    const isCurrentlyFullyPicked = currentCount >= item.quantity;
    const isCurrentlyPartiallyPicked = currentCount > 0 && currentCount < item.quantity;
    
    if (isCurrentlyFullyPicked) {
      return 'bg-green-900/20 border-green-500/50 hover:border-green-400/50 hover:shadow-2xl hover:shadow-green-500/20';
    } else if (isSelected) {
      // Selected state takes priority - keep purple border even if partially picked
      const bgColor = isCurrentlyPartiallyPicked ? 'bg-yellow-900/20' : 'bg-blue-500/[0.08]';
      return `${bgColor} backdrop-blur-xl border-blue-500/60 hover:border-blue-500/80 hover:bg-blue-500/[0.05] shadow-lg shadow-blue-500/25`;
    } else if (isCurrentlyPartiallyPicked) {
      return 'bg-yellow-900/20 border-yellow-500/50 hover:border-yellow-400/50 hover:shadow-2xl hover:shadow-yellow-500/20';
    } else if (isNextToPick) {
      return 'bg-blue-500/[0.08] backdrop-blur-xl border-cyan-500/60 hover:border-cyan-500/80 hover:bg-blue-500/[0.05] shadow-lg shadow-cyan-500/25';
    } else {
      return 'bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20';
    }
  }, [isFullyPicked, isPartiallyPicked, isSelected, isNextToPick, editingQuantity, tempQuantity, pickedCount, item.quantity]);


  // Memoize progress percentage (use temp quantity in edit mode)
  const progressPercentage = useMemo(() => {
    const currentCount = editingQuantity === item.id ? 
      (parseInt(tempQuantity) || 0) : 
      pickedCount;
    return (currentCount / item.quantity) * 100;
  }, [pickedCount, item.quantity, editingQuantity, tempQuantity]);

  // Get tier system styling for checkmarks based on item quantity
  const tierSystem = useTierSystem(item.quantity);
  
  // Memoize tier-based checkmark styling
  const checkmarkClasses = useMemo(() => {
    // Always use blue for completed items
    if (sectionId === 'completedItems') {
      return 'text-blue-400';
    }
    
    if (!tierSystem || !tierSystem.name) {
      // Default green for non-tiered items
      return 'text-green-400';
    }
    
    // Use tier colors for checkmarks
    switch (tierSystem.name) {
      case 'COSMIC':
        return 'text-cyan-400';
      case 'MEGA':
        return 'text-pink-400';
      case 'SUPER':
        return 'text-orange-400';
      case 'TIER':
        return 'text-blue-400';
      default:
        return 'text-green-400';
    }
  }, [tierSystem, sectionId]);

  // Memoize tier-based checkmark background styling
  const checkmarkBgClasses = useMemo(() => {
    if (!tierSystem || !tierSystem.name) {
      // Default green background for non-tiered items
      return 'bg-gradient-to-r from-green-400 to-green-500 shadow-green-500/50';
    }
    
    // Use tier colors for checkmark backgrounds
    switch (tierSystem.name) {
      case 'COSMIC':
        return 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 shadow-cyan-500/50 animate-pulse';
      case 'MEGA':
        return 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 shadow-pink-500/50 animate-pulse';
      case 'SUPER':
        return 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-orange-500/50';
      case 'TIER':
        return 'bg-gradient-to-r from-blue-400 to-blue-500 shadow-blue-500/50';
      default:
        return 'bg-gradient-to-r from-green-400 to-green-500 shadow-green-500/50';
    }
  }, [tierSystem]);

  // Memoize tier-based animation properties for checkmarks
  const checkmarkAnimationProps = useMemo(() => {
    if (!tierSystem || !tierSystem.name) return {};
    
    switch (tierSystem.name) {
      case 'COSMIC':
        return {
          animate: { 
            scale: [1, 1.05, 1], 
            rotate: [0, 5, -5, 0],
            transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }
        };
      case 'MEGA':
        return {
          animate: { 
            scale: [1, 1.03, 1],
            transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }
        };
      default:
        return {};
    }
  }, [tierSystem]);

  // Memoized event handlers
  const handleClick = useCallback((e) => {
    // Always prevent event bubbling to parent elements (like collapsible headers)
    e.stopPropagation();
    
    // Prevent card click during drag operations
    if (isDragging) {
      e.preventDefault();
      return;
    }

    // Prevent card click if clicking on interactive elements
    const clickedElement = e.target;
    const isInteractiveElement = 
      clickedElement.closest('button') || 
      clickedElement.closest('.no-card-click') ||
      clickedElement.tagName === 'BUTTON' ||
      clickedElement.tagName === 'INPUT' ||
      clickedElement.closest('input');
    
    if (isInteractiveElement) {
      return;
    }
    
    // Also prevent if we just closed an edit input
    if (onEditingRef.current) {
      // Reset the editing flag after a short delay
      setTimeout(() => {
        onEditingRef.current = false;
      }, 100);
      return;
    }
    
    onItemClick(item.id);
  }, [item.id, onItemClick, onEditingRef, isDragging]);

  const handleMouseEnter = useCallback(() => {
    playSound('hover');
  }, []);

  const handleAddClick = useCallback((e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    onAddItem(item.id, e);
  }, [item.id, onAddItem, isDragging]);

  const handleRemoveClick = useCallback((e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    onRemoveItem(item.id, e);
  }, [item.id, onRemoveItem, isDragging]);


  // Render minimized version for completed items
  if (isMinimized) {
    return (
      <motion.div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onMouseDown) onMouseDown();
        }}
        onDragStart={(e) => e.preventDefault()}
        className={`relative p-8 rounded-xl border transition-all duration-300 min-h-[320px] ${isDragging ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} group ${cardClasses}`}
        initial={hasAnimated ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        animate={removedItemId === item.id ? {
          scale: [1, 0.97, 1.01, 1]
        } : hasAnimated ? {} : {
          opacity: 1,
          scale: 1,
          transition: { delay: index * 0.02 }
        }}
        transition={{ 
          duration: 0.25,
          ease: [0.4, 0, 0.2, 1]
        }}
        whileHover={{ 
          scale: 1.05, 
          y: -2, 
          transition: { type: "spring", stiffness: 500, damping: 25 } 
        }}
      >
        {/* Gradient overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-500/0 to-green-500/0 group-hover:from-green-500/10 group-hover:via-green-500/5 group-hover:to-green-500/10 rounded-xl transition-all duration-300" />
        
        {/* Red flash overlay for minus button clicks */}
        <AnimatePresence>
          {removedItemId === item.id && (
            <motion.div
              key={`red-flash-${Date.now()}`}
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ 
                opacity: 0,
                backgroundColor: 'rgba(220, 38, 38, 0)'
              }}
              animate={{
                opacity: [0, 0.6, 0.3, 0],
                backgroundColor: [
                  'rgba(220, 38, 38, 0)',
                  'rgba(220, 38, 38, 0.6)',
                  'rgba(220, 38, 38, 0.3)',
                  'rgba(220, 38, 38, 0)'
                ]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.2, 0.6, 1]
              }}
            />
          )}
        </AnimatePresence>

        {/* Green flash overlay for successful picks */}
        <AnimatePresence>
          {pickedItemId === item.id && (
            <motion.div
              key={`green-flash-${Date.now()}`}
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ 
                opacity: 0,
                backgroundColor: 'rgba(34, 197, 94, 0)'
              }}
              animate={{
                opacity: [0, 0.5, 0.25, 0],
                backgroundColor: [
                  'rgba(34, 197, 94, 0)',
                  'rgba(34, 197, 94, 0.5)',
                  'rgba(34, 197, 94, 0.25)',
                  'rgba(34, 197, 94, 0)'
                ]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.2, 0.6, 1]
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Minimized bin location badge */}
        <div className="absolute top-1 right-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 rounded-lg border border-green-500/30">
          <span className="text-green-300 font-bold flex items-center text-3xl">
            <MapPin className="mr-1" size={24} />
            {formatBinLocation(item.binLocation)}
          </span>
        </div>

        {/* Minus button - Bottom Left for minimized */}
        {pickedCount > 0 && editingQuantity !== item.id && (
          <div className="absolute bottom-1 left-1 z-30">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleRemoveClick}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              className={`bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/50 rounded-lg p-2 transition-all duration-300 hover:scale-110 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center`}
              onMouseEnter={() => playSound('hover')}
              title="Remove one item"
              type="button"
            >
              {sectionId === 'completedItems' ? (
                <X className="text-red-400 pointer-events-none" size={20} />
              ) : (
                <Minus className="text-red-400 pointer-events-none" size={20} />
              )}
            </motion.button>
          </div>
        )}

        {/* Plus button - Bottom Left for minimized */}
        {pickedCount === 0 && editingQuantity !== item.id && (
          <div className="absolute bottom-1 left-1 z-30">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleAddClick}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              className={`bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/50 rounded-lg p-2 transition-all duration-300 hover:scale-110 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center`}
              onMouseEnter={() => playSound('hover')}
              title="Add one item"
              type="button"
            >
              <Plus className="text-blue-400 pointer-events-none" size={20} />
            </motion.button>
          </div>
        )}

        <div className="relative overflow-hidden">
          <div className="text-center mb-4">
            {/* GameIcon positioned above text */}
            <div className="flex items-center justify-center mb-4">
              <GameIcon 
                iconType={getItemIconType(item.name, item.id)}
                iconCount={pickedCount} 
                size={100} 
                iconSize="large"
                showBadge={true}
              />
            </div>
            
            <div className="w-full max-w-full overflow-hidden px-2">
              <p className="font-bold text-3xl text-white/80 line-through truncate" title={item.name}>
                {item.name}
              </p>
            </div>
            <p className="text-2xl text-green-400 flex items-center justify-center mt-2">
              <Barcode className="mr-2" size={28} />
              {item.id}
            </p>
          </div>
          
          <div className="flex items-center justify-center mb-2">
            <div className="relative group">
              <ProgressRing 
                progress={editingQuantity === item.id ? 
                  (parseInt(tempQuantity) || 0) / item.quantity : 
                  pickedCount / item.quantity
                } 
                size={80} 
                strokeWidth={6}
                strokeColor={sectionId === 'completedItems' ? '#3b82f7' : undefined}
              />
              
              {/* Edit icon indicator when in edit mode */}
              {editingQuantity === item.id && (
                <div className="absolute -top-0.5 -right-0.5 z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    className="bg-blue-500 text-white rounded-full p-0.5 shadow-lg"
                  >
                    <Edit3 size={8} />
                  </motion.div>
                </div>
              )}
              
              {/* Smaller clickable area - only when not editing */}
              {editingQuantity !== item.id && (
                <div 
                  className="absolute inset-4 rounded-full cursor-pointer z-10"
                  onClick={(e) => {
                    console.log('Progress ring outer area clicked (minimized):', item.id);
                    e.stopPropagation();
                    e.preventDefault();
                    // Clear the field if starting from 0, otherwise use current count
                    onTempQuantityChange(pickedCount === 0 ? '' : pickedCount.toString());
                    onEditQuantity(item.id, undefined); // Start editing
                  }}
                  title="Click to edit quantity"
                />
              )}
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="text-center no-card-click">
                  {editingQuantity === item.id ? (
                    // Edit mode - show only the input number
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={tempQuantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = parseInt(value) || 0;
                        // Only allow values up to item.quantity
                        if (value === '' || (numValue >= 0 && numValue <= item.quantity)) {
                          onTempQuantityChange(value);
                        }
                      }}
                      onBlur={() => {
                        const newValue = parseInt(tempQuantity) || 0;
                        if (newValue >= 0 && newValue <= item.quantity) {
                          onEditQuantity(item.id, newValue);
                        } else {
                          onEditQuantity(item.id, undefined); // Cancel edit
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newValue = parseInt(tempQuantity) || 0;
                          if (newValue >= 0 && newValue <= item.quantity) {
                            onEditQuantity(item.id, newValue);
                          } else {
                            onEditQuantity(item.id, undefined); // Cancel edit
                          }
                        } else if (e.key === 'Escape') {
                          onEditQuantity(item.id, undefined); // Cancel edit
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      autoFocus
                      className={`w-10 text-center bg-transparent border-none outline-none text-sm font-bold cursor-text no-card-click ${
                        (parseInt(tempQuantity) || 0) >= item.quantity ? 'text-green-400' : 
                        (parseInt(tempQuantity) || 0) > 0 ? 'text-yellow-400' : 
                        'text-white'
                      }`}
                      style={{ 
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield',
                        appearance: 'none'
                      }}
                      placeholder="0"
                    />
                  ) : (
                    // Display mode - show checkmark or quantity
                    <div 
                      className="flex items-center justify-center cursor-pointer pointer-events-auto"
                      onClick={(e) => {
                        console.log('Progress ring number clicked (minimized):', item.id);
                        e.stopPropagation();
                        e.preventDefault();
                        // Clear the field if starting from 0, otherwise use current count
                        onTempQuantityChange(pickedCount === 0 ? '' : pickedCount.toString());
                        onEditQuantity(item.id, undefined); // Start editing
                      }}
                      title="Click to edit quantity"
                    >
                      {isFullyPicked ? (
                        <CheckCircle className={checkmarkClasses} size={20} />
                      ) : (
                        <span className={`text-sm font-bold ${
                          pickedCount >= item.quantity ? 'text-green-400' : 
                          pickedCount > 0 ? 'text-yellow-400' : 
                          'text-white'
                        }`}>
                          {pickedCount}/{item.quantity}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
          
          {/* ENTER hint when editing */}
          {editingQuantity === item.id && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded px-2 py-0.5 text-green-400 font-bold text-xs uppercase tracking-wider">
                ENTER
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Render compact version for Items to Pick in bottom dropzones
  if (isCompact) {
    return (
      <motion.div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onMouseDown) onMouseDown();
        }}
        onDragStart={(e) => e.preventDefault()}
        className={`relative p-3 rounded-xl border transition-all duration-300 min-h-[280px] ${isDragging ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} group ${cardClasses}`}
        initial={hasAnimated ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        animate={hasAnimated ? {} : {
          opacity: 1,
          scale: 1,
          transition: { delay: index * 0.02 }
        }}
        transition={{ 
          duration: 0.25,
          ease: [0.4, 0, 0.2, 1]
        }}
        whileHover={{ 
          scale: 1.02, 
          y: -2, 
          transition: { type: "spring", stiffness: 400, damping: 15 } 
        }}
      >
        {/* Gradient overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/8 group-hover:via-purple-500/4 group-hover:to-blue-500/8 rounded-xl transition-all duration-500" />
        
        {/* Bin location badge */}
        <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
          <span className="text-blue-300 font-bold flex items-center text-2xl">
            <MapPin className="mr-1.5" size={24} />
            {formatBinLocation(item.binLocation)}
          </span>
        </div>

        {/* Minus/Plus buttons */}
        {pickedCount > 0 && editingQuantity !== item.id && (
          <div className="absolute bottom-2 left-2 z-30">
            <motion.button
              onClick={handleRemoveClick}
              className={`bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/50 rounded-xl p-6 transition-all duration-300 hover:scale-110 cursor-pointer min-w-[80px] min-h-[80px] flex items-center justify-center`}
              title="Remove one item"
            >
              {sectionId === 'completedItems' ? (
                <X className="text-red-400" size={40} />
              ) : (
                <Minus className="text-red-400" size={40} />
              )}
            </motion.button>
          </div>
        )}

        {pickedCount === 0 && editingQuantity !== item.id && (
          <div className="absolute bottom-2 left-2 z-30">
            <motion.button
              onClick={handleAddClick}
              className={`bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/50 rounded-xl p-6 transition-all duration-300 hover:scale-110 cursor-pointer min-w-[80px] min-h-[80px] flex items-center justify-center`}
              title="Add one item"
            >
              <Plus className="text-blue-400" size={40} />
            </motion.button>
          </div>
        )}

        <div className="relative overflow-hidden">
          <div className="text-center mb-3">
            {/* GameIcon positioned above text - centered */}
            <div className="flex items-center justify-center mb-3">
              <GameIcon 
                iconType={getItemIconType(item.name, item.id)}
                iconCount={pickedCount} 
                size={64} 
                iconSize="medium"
                showBadge={true}
              />
            </div>
            
            <div className="w-full max-w-full overflow-hidden px-2">
              <p className={`font-bold text-2xl text-white truncate ${isFullyPicked ? 'line-through opacity-60' : ''}`} title={item.name}>
                {item.name}
              </p>
            </div>
            <p className="text-xl text-blue-400 flex items-center justify-center mt-2">
              <Barcode className="mr-2" size={20} />
              {item.id}
            </p>
          </div>
          
          <div className="flex items-center justify-center mb-2">
            <div className="relative group">
              <ProgressRing 
                progress={editingQuantity === item.id ? 
                  (parseInt(tempQuantity) || 0) / item.quantity : 
                  pickedCount / item.quantity
                } 
                size={60} 
                strokeWidth={4}
                strokeColor={sectionId === 'completedItems' ? '#3b82f7' : undefined}
              />
              
              {/* Edit icon indicator when in edit mode */}
              {editingQuantity === item.id && (
                <div className="absolute -top-0.5 -right-0.5 z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    className="bg-blue-500 text-white rounded-full p-0.5 shadow-lg"
                  >
                    <Edit3 size={6} />
                  </motion.div>
                </div>
              )}
              
              {/* Clickable area for editing */}
              {editingQuantity !== item.id && (
                <div 
                  className="absolute inset-2 rounded-full cursor-pointer z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onTempQuantityChange(pickedCount === 0 ? '' : pickedCount.toString());
                    onEditQuantity(item.id, undefined);
                  }}
                  title="Click to edit quantity"
                />
              )}
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="text-center no-card-click">
                  {editingQuantity === item.id ? (
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={tempQuantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = parseInt(value) || 0;
                        if (value === '' || (numValue >= 0 && numValue <= item.quantity)) {
                          onTempQuantityChange(value);
                        }
                      }}
                      onBlur={() => {
                        const newValue = parseInt(tempQuantity) || 0;
                        if (newValue >= 0 && newValue <= item.quantity) {
                          onEditQuantity(item.id, newValue);
                        } else {
                          onEditQuantity(item.id, undefined);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newValue = parseInt(tempQuantity) || 0;
                          if (newValue >= 0 && newValue <= item.quantity) {
                            onEditQuantity(item.id, newValue);
                          } else {
                            onEditQuantity(item.id, undefined);
                          }
                        } else if (e.key === 'Escape') {
                          onEditQuantity(item.id, undefined);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      autoFocus
                      className={`w-8 text-center bg-transparent border-none outline-none text-xs font-bold cursor-text no-card-click ${
                        (parseInt(tempQuantity) || 0) >= item.quantity ? 'text-green-400' : 
                        (parseInt(tempQuantity) || 0) > 0 ? 'text-yellow-400' : 
                        'text-white'
                      }`}
                      style={{ 
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield',
                        appearance: 'none'
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <div 
                      className="flex items-center justify-center cursor-pointer pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onTempQuantityChange(pickedCount === 0 ? '' : pickedCount.toString());
                        onEditQuantity(item.id, undefined);
                      }}
                      title="Click to edit quantity"
                    >
                      {isFullyPicked ? (
                        <CheckCircle className={checkmarkClasses} size={16} />
                      ) : (
                        <span className={`text-xs font-bold ${
                          pickedCount >= item.quantity ? 'text-green-400' : 
                          pickedCount > 0 ? 'text-yellow-400' : 
                          'text-white'
                        }`}>
                          {pickedCount}/{item.quantity}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* ENTER hint when editing */}
          {editingQuantity === item.id && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded px-2 py-0.5 text-green-400 font-bold text-xs uppercase tracking-wider">
                ENTER
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (onMouseDown) onMouseDown();
      }}
      onDragStart={(e) => e.preventDefault()}
      className={`relative p-6 rounded-2xl border transition-all duration-300 min-h-[400px] ${isDragging ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} group ${cardClasses}`}
      initial={hasAnimated ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      animate={hasAnimated ? {} : {
        opacity: 1,
        scale: 1,
        transition: { delay: index * 0.05 }
      }}
      transition={{ 
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1],
        times: [0, 0.3, 0.7, 1]
      }}
      whileHover={{ 
        scale: 1.03, 
        y: -6, 
        transition: { type: "spring", stiffness: 400, damping: 15, mass: 0.5 } 
      }}
    >
      {/* Gradient overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/5 group-hover:to-blue-500/10 rounded-2xl transition-all duration-500" />
      
      {/* Red flash overlay for minus button clicks */}
      <AnimatePresence>
        {removedItemId === item.id && (
          <motion.div
            key={`red-flash-${Date.now()}`}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ 
              opacity: 0,
              backgroundColor: 'rgba(220, 38, 38, 0)'
            }}
            animate={{
              opacity: [0, 0.6, 0.3, 0],
              backgroundColor: [
                'rgba(220, 38, 38, 0)',
                'rgba(220, 38, 38, 0.6)',
                'rgba(220, 38, 38, 0.3)',
                'rgba(220, 38, 38, 0)'
              ]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.2, 0.6, 1]
            }}
          />
        )}
      </AnimatePresence>

      {/* Green flash overlay for successful picks */}
      <AnimatePresence>
        {pickedItemId === item.id && (
          <motion.div
            key={`green-flash-${Date.now()}`}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ 
              opacity: 0,
              backgroundColor: 'rgba(34, 197, 94, 0)'
            }}
            animate={{
              opacity: [0, 0.5, 0.25, 0],
              backgroundColor: [
                'rgba(34, 197, 94, 0)',
                'rgba(34, 197, 94, 0.5)',
                'rgba(34, 197, 94, 0.25)',
                'rgba(34, 197, 94, 0)'
              ]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.2, 0.6, 1]
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Bin location badge */}
      <div className="absolute bottom-4 right-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-6 py-3 rounded-xl border border-blue-500/30">
        <span className="text-5xl font-bold text-blue-300 flex items-center">
          <MapPin className="mr-3" size={40} />
          {formatBinLocation(item.binLocation)}
        </span>
      </div>

      {/* Minus button - Bottom Left */}
      {pickedCount > 0 && editingQuantity !== item.id && (
        <div className="absolute bottom-4 left-4 z-30">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleRemoveClick}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            className={`bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/50 rounded-xl p-6 transition-all duration-300 hover:scale-110 cursor-pointer min-w-[80px] min-h-[80px] flex items-center justify-center`}
            onMouseEnter={() => playSound('hover')}
            title="Remove one item"
            type="button"
          >
            {sectionId === 'completedItems' ? (
              <X className="text-red-400 pointer-events-none" size={40} />
            ) : (
              <Minus className="text-red-400 pointer-events-none" size={40} />
            )}
          </motion.button>
        </div>
      )}


      {/* Next Item Indicator - Show when item is next to pick (selected but not fully picked) */}
      {(isNextToPick && !isFullyPicked) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <motion.div 
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-blue-500/50 flex items-center justify-center gap-1"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Navigation size={14} />
            </motion.div>
            <span>Next</span>
          </motion.div>
        </div>
      )}
      
      <div className="relative">
        {/* GameIcon positioned at top left */}
        <div className="absolute top-0 left-0 z-10">
          <GameIcon 
            iconType={getItemIconType(item.name, item.id)}
            iconCount={pickedCount} 
            size={120} 
            iconSize="xlarge"
            showBadge={true}
          />
        </div>
        
        <div className="flex justify-between items-start mb-4">
          <div className={`flex-1 ${isFullyPicked ? 'opacity-60' : ''}`}>
            <div className="flex flex-col items-center mb-4 pt-16">
              <div className="w-full max-w-full overflow-hidden px-4">
                <p className={`font-bold text-6xl text-white truncate text-center ${isFullyPicked ? 'line-through' : ''}`} title={item.name}>
                  {item.name}
                </p>
              </div>
            </div>
            <p className="text-5xl text-blue-400 flex items-center justify-center mb-6">
              <Barcode className="mr-4" size={48} />
              {item.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center relative mb-4">
          <div className="relative group">
            <ProgressRing 
              progress={editingQuantity === item.id ? 
                (parseInt(tempQuantity) || 0) / item.quantity : 
                pickedCount / item.quantity
              } 
              size={160} 
              strokeWidth={10}
              strokeColor={sectionId === 'completedItems' ? '#3b82f7' : undefined}
            />
              {/* Edit icon indicator when in edit mode */}
              {editingQuantity === item.id && (
                <div className="absolute -top-1 -right-1 z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    className="bg-blue-500 text-white rounded-full p-1 shadow-lg"
                  >
                    <Edit3 size={12} />
                  </motion.div>
                </div>
              )}
              
              {/* Smaller clickable area - only when not editing */}
              {editingQuantity !== item.id && (
                <div 
                  className="absolute inset-8 rounded-full cursor-pointer z-10"
                  onClick={(e) => {
                    console.log('Progress ring outer area clicked (full size):', item.id);
                    console.log('Current editingQuantity:', editingQuantity);
                    console.log('Calling onTempQuantityChange with:', pickedCount === 0 ? '' : pickedCount.toString());
                    console.log('Calling onEditQuantity with:', item.id, undefined);
                    e.stopPropagation();
                    e.preventDefault();
                    // Clear the field if starting from 0, otherwise use current count
                    onTempQuantityChange(pickedCount === 0 ? '' : pickedCount.toString());
                    onEditQuantity(item.id, undefined); // Start editing
                  }}
                  title="Click to edit quantity"
                />
              )}
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="text-center no-card-click">
                  {editingQuantity === item.id ? (
                    // Edit mode - show only the input number
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={tempQuantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = parseInt(value) || 0;
                        // Only allow values up to item.quantity
                        if (value === '' || (numValue >= 0 && numValue <= item.quantity)) {
                          onTempQuantityChange(value);
                        }
                      }}
                      onBlur={() => {
                        const newValue = parseInt(tempQuantity) || 0;
                        if (newValue >= 0 && newValue <= item.quantity) {
                          onEditQuantity(item.id, newValue);
                        } else {
                          onEditQuantity(item.id, undefined); // Cancel edit
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newValue = parseInt(tempQuantity) || 0;
                          if (newValue >= 0 && newValue <= item.quantity) {
                            onEditQuantity(item.id, newValue);
                          } else {
                            onEditQuantity(item.id, undefined); // Cancel edit
                          }
                        } else if (e.key === 'Escape') {
                          onEditQuantity(item.id, undefined); // Cancel edit
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      autoFocus
                      className={`w-16 text-center bg-transparent border-none outline-none text-3xl font-bold cursor-text no-card-click ${
                        (parseInt(tempQuantity) || 0) >= item.quantity ? 'text-green-400' : 
                        (parseInt(tempQuantity) || 0) > 0 ? 'text-yellow-400' : 
                        'text-white'
                      }`}
                      style={{ 
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield',
                        appearance: 'none'
                      }}
                      placeholder="0"
                    />
                  ) : (
                    // Display mode - show checkmark when fully picked, otherwise X/Y format
                    <div 
                      className="flex items-center justify-center cursor-pointer pointer-events-auto"
                      onClick={(e) => {
                        console.log('Progress ring number clicked (full size):', item.id);
                        console.log('Current editingQuantity:', editingQuantity);
                        console.log('Calling onTempQuantityChange with:', pickedCount === 0 ? '' : pickedCount.toString());
                        console.log('Calling onEditQuantity with:', item.id, undefined);
                        e.stopPropagation();
                        e.preventDefault();
                        // Clear the field if starting from 0, otherwise use current count
                        onTempQuantityChange(pickedCount === 0 ? '' : pickedCount.toString());
                        onEditQuantity(item.id, undefined); // Start editing
                      }}
                      title="Click to edit quantity"
                    >
                      {isFullyPicked ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                          <CheckCircle className={`${checkmarkClasses} drop-shadow-lg`} size={48} />
                        </motion.div>
                      ) : (
                        <>
                          {pickedCount > 0 && (
                            <span className={`text-3xl font-bold ${
                              isPartiallyPicked ? 'text-yellow-400' : 
                              'text-white'
                            }`}>
                              {pickedCount}
                            </span>
                          )}
                          <span className={`text-3xl font-bold ${
                            isPartiallyPicked ? 'text-yellow-400' : 
                            'text-white'
                          }`}>
                            /{item.quantity}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
            </div>
        </div>


        {/* ENTER button - centered below circle when editing */}
        {editingQuantity === item.id && (
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl px-6 py-4 text-green-400 font-bold text-lg uppercase tracking-wider">
              ENTER
            </div>
          </div>
        )}
            
        
        {/* Status text */}
        {isFullyPicked ? (
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-green-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <CheckCircle className="animate-pulse" size={24} />
              <span className="font-semibold text-xl">Complete</span>
            </div>
          </div>
        ) : isPartiallyPicked ? (
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <ScanLine className="animate-pulse" size={24} />
              <span className="font-semibold text-xl">Continue Picking</span>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <ScanLine className="animate-pulse" size={24} />
              <span className="font-semibold text-xl">Click to Pick</span>
            </div>
          </div>
        )}
      </div>

      {/* Plus button - Bottom Left */}
      {pickedCount === 0 && editingQuantity !== item.id && (
        <div className="absolute bottom-4 left-4 z-30">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleAddClick}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            className={`bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/50 rounded-xl p-6 transition-all duration-300 hover:scale-110 cursor-pointer min-w-[80px] min-h-[80px] flex items-center justify-center`}
            onMouseEnter={() => playSound('hover')}
            title="Add one item"
            type="button"
          >
            <Plus className="text-blue-400 pointer-events-none" size={40} />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
});

OptimizedPickingItem.displayName = 'OptimizedPickingItem';

export default OptimizedPickingItem;