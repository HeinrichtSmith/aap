import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Target,
  CheckCircle,
  AlertCircle,
  Zap,
  Star,
  ShoppingCart,
  Barcode,
  CalendarDays,
  BarChart3,
  Layers,
  ScanLine,
  MapPin,
  Navigation,
  Clock,
  TrendingUp,
  Minus,
  Plus,
  Edit2,
  Check,
  AlertTriangle
} from 'lucide-react';

import ScanInput from '../ScanInput';
import PickingTimer from './PickingTimer';
import PriorityBadge from '../PriorityBadge';
import ProgressRing from '../ProgressRing.jsx';
import BackButton from '../BackButton';
import GameIcon from '../GameIcon';
import { playSound, initializeAudio, isAudioInitialized } from '../../utils/audio';
import { formatDate } from '../../utils/formatters';

// Import comprehensive icon mapping from central constants
import { getItemIconType } from '../../config/gameIconConstants';

const PickingScreen = ({ order, onComplete, initialPickedItems = [], resetSelection = false }) => {
  const [pickedItems, setPickedItems] = useState(initialPickedItems);
  const [timerActive, setTimerActive] = useState(true);
  const [combo, setCombo] = useState(0);
  const [showComboAnimation, setShowComboAnimation] = useState(false);
  const [perfectStreak, setPerfectStreak] = useState(true);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [finalTime, setFinalTime] = useState(null);
  const [audioStatus, setAudioStatus] = useState('not-initialized');
  const [animatedItems, setAnimatedItems] = useState(new Set());
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [currentBinLocation, setCurrentBinLocation] = useState(null);
  const [removedItemId, setRemovedItemId] = useState(null);
  const [pickedItemId, setPickedItemId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [tempQuantity, setTempQuantity] = useState('');
  const timerStopRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const completeSoundPlayedRef = useRef(false);
  const pickedItemTimeoutRef = useRef(null);
  const removedItemTimeoutRef = useRef(null);

  // Calculate total progress
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPicked = pickedItems.length;
  const allItemsPicked = order.items.every(item => {
    const pickedCount = pickedItems.filter(id => id === item.id).length;
    return pickedCount >= item.quantity;
  });

  // Reset timer state when returning to picking screen
  useEffect(() => {
    if (allItemsPicked && initialPickedItems.length > 0) {
      // If we're returning to picking with all items already picked, stop the timer
      timerStopRef.current = true;
      setTimerActive(false);
    }
  }, []);

  // Reset selection when explicitly requested (e.g., from edit button)
  useEffect(() => {
    if (resetSelection) {
      console.log('Resetting selection due to resetSelection prop');
      setSelectedItemId(null);
    }
  }, [resetSelection]);

  // Debug: Log when selectedItemId changes
  useEffect(() => {
    console.log('selectedItemId changed to:', selectedItemId);
  }, [selectedItemId]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (pickedItemTimeoutRef.current) {
        clearTimeout(pickedItemTimeoutRef.current);
      }
      if (removedItemTimeoutRef.current) {
        clearTimeout(removedItemTimeoutRef.current);
      }
    };
  }, []);

  // Audio initialization
  useEffect(() => {
    const handleInteraction = async (e) => {
      if (isAudioInitialized()) return;
      
      console.log('User interaction detected on picking screen, initializing audio...');
      
      const success = await initializeAudio();
      if (success) {
        setAudioStatus('initialized');
        setTimeout(() => playSound('click'), 100);
      } else {
        setAudioStatus('failed');
      }
      
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
    
    if (isAudioInitialized()) {
      setAudioStatus('initialized');
    } else {
      document.addEventListener('click', handleInteraction);
      document.addEventListener('touchstart', handleInteraction);
      document.addEventListener('keydown', handleInteraction);
    }
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Find next item to pick
  const getNextItemToPick = () => {
    // First check if there's a selected item that still needs picking
    if (selectedItemId) {
      const selectedItem = order.items.find(i => i.id === selectedItemId);
      if (selectedItem) {
        const pickedCount = pickedItems.filter(id => id === selectedItemId).length;
        if (pickedCount < selectedItem.quantity) {
          return selectedItem;
        }
      }
    }
    
    // If no selected item or selected item is complete, use bin location routing
    // Sort items by bin location for optimal picking path
    const sortedItems = [...order.items].sort((a, b) => 
      a.binLocation.localeCompare(b.binLocation)
    );
    
    for (const item of sortedItems) {
      const pickedCount = pickedItems.filter(id => id === item.id).length;
      if (pickedCount < item.quantity) {
        return item;
      }
    }
    return null;
  };

  const nextItem = getNextItemToPick();

  // Set current bin location based on next item
  useEffect(() => {
    if (nextItem) {
      setCurrentBinLocation(nextItem.binLocation);
    }
  }, [nextItem]);

  const validateScan = (scannedSKU) => {
    const item = order.items.find(i => i.id === scannedSKU);
    if (!item) {
      return false;
    }
    
    const pickedCount = pickedItems.filter(id => id === scannedSKU).length;
    if (pickedCount >= item.quantity) {
      return false;
    }
    
    return true;
  };

  const handleItemScan = (scannedSKU) => {
    hasInteractedRef.current = true; // Mark that user has interacted
    
    const item = order.items.find(i => i.id === scannedSKU);
    if (!item) {
      setCombo(0);
      setPerfectStreak(false);
      setScanError(`Invalid item! "${scannedSKU}" is not in this order.`);
      setScanSuccess(false);
      setTimeout(() => setScanError(''), 3000);
      playSound('error');
      return;
    }

    const pickedCount = pickedItems.filter(id => id === scannedSKU).length;
    if (pickedCount >= item.quantity) {
      setScanError(`Already picked all ${item.quantity} of ${item.name}`);
      setScanSuccess(false);
      setTimeout(() => setScanError(''), 3000);
      playSound('error');
      return;
    }

    setPickedItems([...pickedItems, scannedSKU]);
    setCombo(prev => prev + 1);
    setScanError('');
    setScanSuccess(true);
    setTimeout(() => setScanSuccess(false), 2000);
    
    // Auto-select the scanned item for visual feedback (unless we're resetting)
    if (!resetSelection) {
      setSelectedItemId(scannedSKU);
    }
    
    // Check if the scanned item is now fully picked
    const newPickedCount = pickedItems.filter(id => id === scannedSKU).length + 1;
    const isItemNowComplete = newPickedCount >= item.quantity;
    
    if (isItemNowComplete) {
      // Clear selection if item is fully picked so next item can be highlighted
      setTimeout(() => setSelectedItemId(null), 1000);
    }
    
    if (combo > 0 && combo % 5 === 0) {
      setShowComboAnimation(true);
      playSound('combo');
      setTimeout(() => setShowComboAnimation(false), 1000);
    } else if (isItemNowComplete) {
      // Play success sound when item is fully picked (save complete for order finish)
      playSound('success');
    } else {
      playSound('success');
    }

    // Visual effect: flash green for successful pick
    setPickedItemId(scannedSKU);
    
    // Clear any existing timeout before setting new one
    if (pickedItemTimeoutRef.current) {
      clearTimeout(pickedItemTimeoutRef.current);
    }
    pickedItemTimeoutRef.current = setTimeout(() => {
      setPickedItemId(null);
      pickedItemTimeoutRef.current = null;
    }, 350);
    
    const newPickedItems = [...pickedItems, scannedSKU];
    const allPicked = order.items.every(item => {
      const count = newPickedItems.filter(id => id === item.id).length;
      return count >= item.quantity;
    });

    if (allPicked && !timerStopRef.current) {
      timerStopRef.current = true;
      setTimerActive(false);
    }
  };

  // Handle item click for selection (picking workflow)
  const handleItemClick = (itemId) => {
    const item = order.items.find(i => i.id === itemId);
    if (!item) return;
    
    const pickedCount = pickedItems.filter(id => id === itemId).length;
    
    // If item is fully picked, just play error sound
    if (pickedCount >= item.quantity) {
      playSound('error');
      return;
    }
    
    // Check if this is the next item to pick (for direct picking)
    const nextItem = getNextItemToPick();
    const isNextToPick = nextItem && nextItem.id === itemId;
    
    // If this is the next item and it's not already selected, pick it directly
    if (isNextToPick && selectedItemId !== itemId) {
      handleItemScan(itemId);
      return;
    }
    
    // If this item isn't selected, select it (unless we're resetting)
    if (selectedItemId !== itemId) {
      if (!resetSelection) {
        setSelectedItemId(itemId);
        playSound('click');
      }
    } else {
      // If it's already selected, pick it
      handleItemScan(itemId);
    }
  };

  const isItemFullyPicked = (itemId) => {
    const item = order.items.find(i => i.id === itemId);
    const pickedCount = pickedItems.filter(id => id === itemId).length;
    return pickedCount >= item.quantity;
  };

  const isItemPartiallyPicked = (itemId) => {
    const pickedCount = pickedItems.filter(id => id === itemId).length;
    return pickedCount > 0 && !isItemFullyPicked(itemId);
  };

  const getPickedCount = (itemId) => {
    return pickedItems.filter(id => id === itemId).length;
  };

  const handleAddItem = (itemId, e) => {
    if (e) e.stopPropagation(); // Prevent triggering the card click
    hasInteractedRef.current = true; // Mark that user has interacted
    
    const item = order.items.find(i => i.id === itemId);
    const currentCount = getPickedCount(itemId);
    
    if (currentCount < item.quantity) {
      setPickedItems([...pickedItems, itemId]);
      playSound('success');
      setCombo(prev => prev + 1);
      
      // Auto-select the item for visual feedback (unless we're resetting)
      if (!resetSelection) {
        setSelectedItemId(itemId);
      }
      
      // Check if all items are now picked
      const newPickedItems = [...pickedItems, itemId];
      const allPicked = order.items.every(item => {
        const count = newPickedItems.filter(id => id === item.id).length;
        return count >= item.quantity;
      });

      if (allPicked && !timerStopRef.current) {
        timerStopRef.current = true;
        setTimerActive(false);
      }
    } else {
      playSound('error');
    }
  };

  const handleRemoveItem = (itemId, e) => {
    e.stopPropagation(); // Prevent triggering the card click
    hasInteractedRef.current = true; // Mark that user has interacted
    
    const currentCount = getPickedCount(itemId);
    if (currentCount > 0) {
      // Find the last occurrence of this item and remove it
      const lastIndex = pickedItems.lastIndexOf(itemId);
      if (lastIndex > -1) {
        const newPickedItems = [...pickedItems];
        newPickedItems.splice(lastIndex, 1);
        setPickedItems(newPickedItems);
        playSound('error');
        
        // Auto-select the item for visual feedback (unless we're resetting)
        if (!resetSelection) {
          setSelectedItemId(itemId);
        }
        
        // Visual effect: flash red
        setRemovedItemId(itemId);
        
        // Clear any existing timeout before setting new one
        if (removedItemTimeoutRef.current) {
          clearTimeout(removedItemTimeoutRef.current);
        }
        removedItemTimeoutRef.current = setTimeout(() => {
          setRemovedItemId(null);
          removedItemTimeoutRef.current = null;
        }, 500);
        
        // Reset combo and streak if removing items
        setCombo(0);
        setPerfectStreak(false);
        
        // If we're no longer at 100% completion, reactivate the timer
        const stillAllPicked = order.items.every(item => {
          const count = newPickedItems.filter(id => id === item.id).length;
          return count >= item.quantity;
        });
        
        if (!stillAllPicked && timerStopRef.current) {
          timerStopRef.current = false;
          setTimerActive(true);
          setFinalTime(null); // Reset final time so navigation doesn't trigger
          completeSoundPlayedRef.current = false; // Reset sound flag so it can play again
        }
      }
    }
  };

  const handleFinishPicking = (seconds) => {
    setFinalTime(seconds);
  };

  useEffect(() => {
    // Only allow navigation after user has interacted with the screen
    if (!hasInteractedRef.current) {
      return;
    }
    
    if (allItemsPicked && finalTime !== null && !completeSoundPlayedRef.current) {
      completeSoundPlayedRef.current = true;
      setTimeout(() => {
        playSound('complete');
        onComplete({ 
          time: finalTime, 
          perfectStreak, 
          combo, 
          pickedItems,
          accuracy: perfectStreak ? 100 : 90 // Simple accuracy calculation
        });
      }, 500);
    } else if (allItemsPicked && finalTime === null) {
      // Fallback: if all items are picked but timer hasn't completed, force timer to complete
      setTimeout(() => {
        if (finalTime === null) {
          setFinalTime(0); // This will trigger the navigation
        }
      }, 500);
    }
  }, [allItemsPicked, finalTime, perfectStreak, combo, pickedItems, onComplete]);

  const totalProgress = totalPicked / totalItems;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Audio status indicator */}
        {audioStatus !== 'initialized' && (
          <div className="fixed top-4 right-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 text-yellow-300 text-sm z-50">
            🔇 Click anywhere to enable sound effects
          </div>
        )}
      
      {showComboAnimation && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-bounce">
            {combo}x COMBO!
          </div>
        </div>
      )}
      
      <BackButton />
      
      {/* Compact Order Header */}
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-white flex items-center">
              <Target className="mr-2 text-blue-400" size={20} />
              Picking Station
            </h1>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-400 flex items-center">
                <ShoppingCart className="mr-1" size={14} />
                SO: <span className="font-bold text-white ml-1">{order.orderId}</span>
              </span>
              <span className="text-gray-400 flex items-center">
                <CalendarDays className="mr-1" size={14} />
                Ready: <span className="font-bold text-white ml-1">{formatDate(order.dueDate)}</span>
              </span>
              <PriorityBadge priority={order.priority} />
            </div>
          </div>
        </div>
      </div>

      {/* Next Item Guidance */}
      {nextItem && !allItemsPicked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                <Navigation className="mr-2 text-blue-400" size={20} />
                Next Item to Pick
              </h3>
              <p className="text-xl font-bold text-white">{nextItem.name}</p>
              <p className="text-sm text-gray-400 mt-1">SKU: {nextItem.id}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-xl border border-blue-500/50">
                <MapPin className="mr-2 text-blue-400" size={20} />
                <span className="text-2xl font-bold text-blue-400">{nextItem.binLocation}</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Quantity: {nextItem.quantity - getPickedCount(nextItem.id)} remaining
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
          <ScanLine className="mr-3 text-blue-400" size={24} />
          Scan Items to Pick
        </h2>
        
        {/* Custom Scan Input matching packing style */}
        <motion.form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.target.querySelector('input');
            if (input.value.trim()) {
              handleItemScan(input.value.trim());
              input.value = '';
            }
          }}
          className="relative"
        >
          <div className="relative">
            <ScanLine className={`absolute left-6 top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
              scanSuccess 
                ? 'text-green-400' 
                : scanError 
                ? 'text-red-400' 
                : 'text-blue-400'
            }`} size={28} />
            <input
              type="text"
              placeholder="Scan item barcode..."
              autoFocus={true}
              className={`w-full pl-16 pr-6 py-5 bg-gray-800/50 border ${
                scanSuccess 
                  ? 'border-green-500 ring-2 ring-green-500/20' 
                  : scanError 
                  ? 'border-red-500 ring-2 ring-red-500/20' 
                  : 'border-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              } rounded-2xl text-white placeholder-gray-400 outline-none transition-all duration-200 text-xl font-mono backdrop-blur`}
            />
            
            {/* Status indicator */}
            <motion.div
              className="absolute right-6 top-1/2 transform -translate-y-1/2"
              animate={
                scanSuccess || scanError
                  ? { scale: [0, 1.2, 1] }
                  : { opacity: [0.5, 1, 0.5] }
              }
              transition={
                scanSuccess || scanError
                  ? { duration: 0.3 }
                  : { duration: 2, repeat: Infinity }
              }
            >
              {scanSuccess ? (
                <Check className="text-green-400" size={24} />
              ) : scanError ? (
                <AlertTriangle className="text-red-400" size={24} />
              ) : (
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              )}
            </motion.div>
          </div>
        </motion.form>
        
        {scanError && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center space-x-3">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-300 font-medium">{scanError}</p>
          </div>
        )}
        <div className="mt-4 text-center text-sm text-gray-500">
          Tip: Navigate to the highlighted bin location and scan the item barcode
        </div>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Package className="mr-2 text-blue-400" size={24} />
              Items to Pick
            </h2>
            
            {/* Integrated compact timer and combo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/[0.05] rounded-xl px-3 py-2">
                <Clock className="text-blue-400" size={16} />
                <div className="text-sm">
                  <PickingTimer 
                    isActive={timerActive} 
                    onTimeUpdate={setFinalTime}
                    estimatedTime={order.estimatedTime}
                    totalProgress={totalProgress}
                    compact={true}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 bg-white/[0.05] rounded-xl px-3 py-2">
                <motion.div
                  animate={combo > 0 ? { rotate: [0, 360] } : {}}
                  transition={{ duration: 1, repeat: combo > 0 ? Infinity : 0, ease: "linear" }}
                >
                  <Zap className="text-yellow-400" size={16} />
                </motion.div>
                <span className={`text-sm font-bold ${combo > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {combo}x Combo
                </span>
              </div>
            </div>
          </div>
          
          {/* Picking progress */}
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Progress</div>
            <div className="flex items-center space-x-2">
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-sm font-bold text-white">
                {totalPicked}/{totalItems}
              </span>
            </div>
          </div>
        </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {order.items.sort((a, b) => a.binLocation.localeCompare(b.binLocation)).map((item, index) => {
              const pickedCount = getPickedCount(item.id);
              const isFullyPicked = isItemFullyPicked(item.id);
              const isPartiallyPicked = isItemPartiallyPicked(item.id);
              const hasAnimated = animatedItems.has(item.id);
              const isNextToPick = nextItem?.id === item.id;
              
              // Mark item as animated after first render
              if (!hasAnimated) {
                setTimeout(() => {
                  setAnimatedItems(prev => new Set(prev).add(item.id));
                }, index * 50 + 100);
              }
              
              return (
                <motion.div
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  onMouseEnter={() => playSound('hover')}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                    isFullyPicked
                      ? 'bg-green-900/20 border-green-500/50 hover:border-green-400/50 hover:shadow-2xl hover:shadow-green-500/20'
                      : isPartiallyPicked
                      ? 'bg-yellow-900/20 border-yellow-500/50 hover:border-yellow-400/50 hover:shadow-2xl hover:shadow-yellow-500/20'
                      : selectedItemId === item.id
                      ? 'bg-yellow-500/[0.08] backdrop-blur-xl border-yellow-500/60 hover:border-yellow-500/80 hover:bg-yellow-500/[0.05] shadow-lg shadow-yellow-500/25'
                      : isNextToPick
                      ? 'bg-blue-500/[0.08] backdrop-blur-xl border-blue-500/60 hover:border-blue-500/80 hover:bg-blue-500/[0.05] shadow-lg shadow-blue-500/25'
                      : 'bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20'
                  }`}
                  initial={hasAnimated ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  animate={removedItemId === item.id ? {
                    scale: [1, 0.97, 1.01, 1]
                  } : hasAnimated ? {} : {
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
                  // whileTap={{ 
                  //   scale: 0.98,
                  //   transition: { type: "spring", stiffness: 600, damping: 20, mass: 0.1 }
                  // }}
                >
                  {/* Gradient overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/5 group-hover:to-blue-500/10 rounded-2xl transition-all duration-500" />
                  
                  {/* Red flash overlay for minus button clicks */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={removedItemId === item.id ? {
                      opacity: [0, 0.6, 0.3, 0],
                      backgroundColor: [
                        'rgba(220, 38, 38, 0)',
                        'rgba(220, 38, 38, 0.6)',
                        'rgba(220, 38, 38, 0.3)',
                        'rgba(220, 38, 38, 0)'
                      ]
                    } : { opacity: 0 }}
                    transition={{ 
                      duration: 0.35,
                      ease: [0.4, 0, 0.2, 1],
                      times: [0, 0.3, 0.7, 1]
                    }}
                  />

                  {/* Green flash overlay for successful picks */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={pickedItemId === item.id ? {
                      opacity: [0, 0.4, 0.2, 0],
                      backgroundColor: [
                        'rgba(34, 197, 94, 0)',
                        'rgba(34, 197, 94, 0.4)',
                        'rgba(34, 197, 94, 0.2)',
                        'rgba(34, 197, 94, 0)'
                      ]
                    } : { opacity: 0 }}
                    transition={{ 
                      duration: 0.35,
                      ease: [0.4, 0, 0.2, 1],
                      times: [0, 0.3, 0.7, 1]
                    }}
                  />
                  
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1 rounded-full border border-blue-500/30">
                    <span className="text-xs font-bold text-blue-300 flex items-center">
                      <MapPin className="mr-1" size={12} />
                      {item.binLocation}
                    </span>
                  </div>

                  {/* Selection Indicator */}
                  {selectedItemId === item.id && !isFullyPicked && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-yellow-500/50 flex items-center space-x-1 z-30 pointer-events-none"
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        ⚡
                      </motion.div>
                      <span>Selected</span>
                    </motion.div>
                  )}

                  {/* Next Item Indicator */}
                  {isNextToPick && !isFullyPicked && selectedItemId !== item.id && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-blue-500/50 flex items-center space-x-1 z-30"
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Navigation size={12} />
                      </motion.div>
                      <span>Next</span>
                    </motion.div>
                  )}
                  
                  <div className="relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`flex-1 ${isFullyPicked ? 'opacity-60' : ''}`}>
                        <p className={`font-bold text-xl mb-2 text-white ${isFullyPicked ? 'line-through' : ''}`}>{item.name}</p>
                        <p className="text-sm text-gray-400 flex items-center">
                          <Barcode className="mr-1" size={14} />
                          {item.id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between relative">
                      <div className="flex items-center space-x-4">
                        <div className="relative group">
                          <ProgressRing 
                            progress={pickedCount / item.quantity} 
                            size={60} 
                            strokeWidth={4}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span 
                              className={`text-lg font-bold cursor-pointer hover:scale-110 transition-transform ${
                                isFullyPicked ? 'text-green-400' : 
                                isPartiallyPicked ? 'text-yellow-400' : 
                                'text-white'
                              }`}
                              title="Picked quantity"
                            >
                              {pickedCount}/{item.quantity}
                            </span>
                          </div>
                        </div>
                        
                        {/* Quantity adjustment buttons */}
                        <div className="flex items-center space-x-2 relative">
                          {/* Minus button to reduce picked quantity */}
                          {pickedCount > 0 && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              onClick={(e) => handleRemoveItem(item.id, e)}
                              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-full p-2 transition-all duration-300 hover:scale-110"
                              onMouseEnter={() => playSound('hover')}
                              title="Remove one item"
                            >
                              <Minus className="text-red-400" size={16} />
                            </motion.button>
                          )}
                          
                          {/* Plus button in its natural position next to minus */}
                          <AnimatePresence>
                            {!isFullyPicked && pickedCount < item.quantity && (
                              <motion.button
                                key="plus-button"
                                layoutId={`action-button-${item.id}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ 
                                  opacity: 1, 
                                  scale: 1
                                }}
                                exit={{ 
                                  opacity: [1, 1, 0.8, 0.5],
                                  scale: [1, 1.5, 2.5, 3],
                                  x: [0, 150, 400, 600],
                                  y: [0, -15, -25, -35],
                                  rotate: [0, 360, 720, 1080],
                                  transition: { 
                                    duration: 0.2,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                    times: [0, 0.2, 0.6, 1]
                                  }
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleAddItem(item.id, e)}
                                onMouseEnter={() => playSound('hover')}
                                className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-full p-2 transition-all duration-300"
                                title="Add one item"
                              >
                                <Plus className="text-green-400" size={16} />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      
                      {/* Checkmark Button appears in the right position */}
                      <AnimatePresence>
                        {isFullyPicked && (
                          <motion.div
                            key="check-button"
                            layoutId={`action-button-${item.id}`}
                            initial={{ 
                              opacity: 0.5,
                              scale: 3,
                              x: -600,
                              y: 35,
                              rotate: -1080
                            }}
                            animate={{ 
                              opacity: 1, 
                              scale: 1,
                              x: 0,
                              y: 0,
                              rotate: 0,
                              transition: { 
                                duration: 0.2,
                                ease: [0.25, 0.46, 0.45, 0.94]
                              }
                            }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="bg-gradient-to-r from-green-400 to-green-500 rounded-full p-3 shadow-lg shadow-green-500/50"
                          >
                            <CheckCircle className="text-white" size={24} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <div className="mt-6 h-2 bg-white/10 rounded-full relative overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isFullyPicked 
                            ? 'bg-gradient-to-r from-green-400 to-green-500' 
                            : isPartiallyPicked
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                            : 'bg-gradient-to-r from-blue-400 to-blue-500'
                        }`}
                        style={{ width: `${(pickedCount / item.quantity) * 100}%` }}
                      />
                    </div>
                    
                    {isFullyPicked ? (
                      <div className="mt-6 flex items-center justify-center">
                        <div className="flex items-center space-x-2 text-green-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <CheckCircle className="animate-pulse" size={16} />
                          <span className="font-semibold">Complete</span>
                        </div>
                      </div>
                    ) : isPartiallyPicked ? (
                      <div className="mt-6 flex items-center justify-center">
                        <div className="flex items-center space-x-2 text-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <ScanLine className="animate-pulse" size={16} />
                          <span className="font-semibold">Continue Picking</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 flex items-center justify-center">
                        <div className="flex items-center space-x-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <ScanLine className="animate-pulse" size={16} />
                          <span className="font-semibold">Click to Pick</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 text-center border border-white/10">
              <BarChart3 className="mx-auto mb-2 text-blue-400" size={24} />
              <p className="text-2xl font-bold">{pickedItems.length}</p>
              <p className="text-xs text-gray-400">Items Picked</p>
            </div>
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 text-center border border-white/10">
              <Package className="mx-auto mb-2 text-purple-400" size={24} />
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-xs text-gray-400">Total Items</p>
            </div>
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 text-center border border-white/10">
              <Layers className="mx-auto mb-2 text-yellow-400" size={24} />
              <p className="text-2xl font-bold">
                {order.items.filter(item => isItemFullyPicked(item.id)).length}/{order.items.length}
              </p>
              <p className="text-xs text-gray-400">SKUs Complete</p>
            </div>
          </div>

          {allItemsPicked && (
            <div className="mt-10 text-center">
              <div className="inline-flex items-center justify-center space-x-2 text-green-400 animate-pulse">
                <CheckCircle size={24} />
                <span className="text-lg font-semibold">All items picked! Completing order...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PickingScreen;