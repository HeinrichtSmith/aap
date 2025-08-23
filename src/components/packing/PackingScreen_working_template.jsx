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

// Animated placeholder component
const AnimatedPlaceholder = () => {
  const placeholderTexts = [
    "Scan item barcode",
    "Ready to scan",
    "Waiting for barcode",
    "Scan to continue"
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const WaveDots = () => (
    <span className="inline-flex ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -3, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
          className="inline-block"
        >
          .
        </motion.span>
      ))}
    </span>
  );

  return (
    <motion.span
      key={currentIndex}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 0.9, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="absolute left-[80px] text-3xl text-blue-400 font-bold pointer-events-none flex items-center drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
      style={{ top: 'calc(50% - 14px)', transform: 'translateY(-50%)' }}
    >
      {placeholderTexts[currentIndex]}<WaveDots />
    </motion.span>
  );
};

const PickingScreen = ({ order, onComplete, initialPickedItems = [], resetSelection = false }) => {
  const [pickedItems, setPickedItems] = useState(initialPickedItems);
  const [timerActive, setTimerActive] = useState(true);
  const [combo, setCombo] = useState(0);
  const [showComboAnimation, setShowComboAnimation] = useState(false);
  const [perfectStreak, setPerfectStreak] = useState(true);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanRemoved, setScanRemoved] = useState(false);
  const [finalTime, setFinalTime] = useState(null);
  const [audioStatus, setAudioStatus] = useState('not-initialized');
  const [animatedItems, setAnimatedItems] = useState(new Set());
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [currentBinLocation, setCurrentBinLocation] = useState(null);
  const [removedItemId, setRemovedItemId] = useState(null);
  const [pickedItemId, setPickedItemId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [tempQuantity, setTempQuantity] = useState('');
  const [inputValue, setInputValue] = useState('');
  const timerStopRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const completeSoundPlayedRef = useRef(false);
  const isEditingRef = useRef(false);
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
      setSelectedItemId(null);
    }
  }, [resetSelection]);

  // Debug: Log when selectedItemId changes
  useEffect(() => {
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
      setTimeout(() => setScanError(''), 2000);
      playSound('error');
      return;
    }

    const pickedCount = pickedItems.filter(id => id === scannedSKU).length;
    if (pickedCount >= item.quantity) {
      setScanError(`Already picked all ${item.quantity} of ${item.name}`);
      setScanSuccess(false);
      setTimeout(() => setScanError(''), 2000);
      playSound('error');
      return;
    }

    setPickedItems([...pickedItems, scannedSKU]);
    setCombo(prev => prev + 1);
    setScanError('');
    setScanSuccess(true);
    setTimeout(() => setScanSuccess(false), 1500);
    
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
    setTimeout(() => setPickedItemId(null), 350);
    
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
    
    // If this item isn't selected, select it
    if (selectedItemId !== itemId) {
      setSelectedItemId(itemId);
      playSound('click');
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
    if (e) {
      e.stopPropagation(); // Prevent triggering the card click
      e.preventDefault(); // Also prevent default behavior
    }
    hasInteractedRef.current = true; // Mark that user has interacted
    
    const item = order.items.find(i => i.id === itemId);
    const currentCount = getPickedCount(itemId);
    
    if (currentCount < item.quantity) {
      setPickedItems([...pickedItems, itemId]);
      playSound('success');
      setCombo(prev => prev + 1);
      
      // Show scan success feedback
      setScanSuccess(true);
      setScanError('');
      setScanRemoved(false);
      setTimeout(() => setScanSuccess(false), 1500);
      
      // Show picked item animation
      setPickedItemId(itemId);
      
      // Clear any existing timeout before setting new one
      if (pickedItemTimeoutRef.current) {
        clearTimeout(pickedItemTimeoutRef.current);
      }
      pickedItemTimeoutRef.current = setTimeout(() => {
        setPickedItemId(null);
        pickedItemTimeoutRef.current = null;
      }, 500);
      
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
      setScanError('Item already fully picked');
      setScanSuccess(false);
      setScanRemoved(false);
      setTimeout(() => setScanError(''), 2000);
    }
  };

  const handleRemoveItem = (itemId, e) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering the card click
      e.preventDefault(); // Also prevent default behavior
    }
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
        
        // Show removed message in scanner
        setScanRemoved(true);
        setScanError('');
        setScanSuccess(false);
        setTimeout(() => setScanRemoved(false), 1500);
        
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
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className={`text-6xl font-bold text-transparent bg-clip-text animate-bounce ${
              combo >= 25 ? 'bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400' :
              combo >= 20 ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-red-400' :
              combo >= 15 ? 'bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400' :
              combo >= 10 ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400' :
              combo >= 5 ? 'bg-gradient-to-r from-green-400 via-blue-400 to-indigo-400' :
              'bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400'
            }`}
          >
            {combo}x {combo >= 25 ? 'LEGENDARY!' : combo >= 20 ? 'EPIC!' : combo >= 15 ? 'AMAZING!' : combo >= 10 ? 'SUPER!' : 'COMBO!'}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mt-4"
          >
            <span className="text-2xl">
              {combo >= 25 ? '🔥💎🔥' : combo >= 20 ? '⚡🌟⚡' : combo >= 15 ? '✨🎯✨' : combo >= 10 ? '🌟💫🌟' : '⭐🔥⭐'}
            </span>
          </motion.div>
        </div>
      )}
      
      <BackButton />
      
      <div>

      <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 border border-white/10 relative">
        {/* Priority badge on top of card */}
        {order.priority && (
          <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: '-20px' }}>
            <PriorityBadge priority={order.priority} size="lg" />
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <Package className="mr-2 text-blue-400" size={28} />
                Items to Pick
              </h2>
              <span className="text-2xl text-gray-400 flex items-center">
                <ShoppingCart className="mr-1" size={28} />
                SO: <span className="font-bold text-white ml-1">{order.orderId}</span>
              </span>
              <span className="text-2xl text-gray-400 flex items-center">
                <CalendarDays className="mr-1" size={28} />
                Ready: <span className="font-bold text-white ml-1">{formatDate(order.dueDate)}</span>
              </span>
            </div>
            
            {/* Timer only */}
            <div className="flex items-center space-x-3 bg-white/[0.05] rounded-xl px-4 py-3">
              <Clock className="text-blue-400" size={24} />
              <div>
                <PickingTimer 
                  isActive={timerActive} 
                  onComplete={handleFinishPicking}
                  onTimeUpdate={setFinalTime}
                  estimatedTime={order.estimatedTime}
                  totalProgress={totalProgress}
                  compact={true}
                />
              </div>
            </div>
          </div>
          
          {/* Picking progress - LARGER */}
          <div className="relative w-48 h-10 bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className="absolute inset-0 h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white z-10">
                {totalPicked}/{totalItems}
              </span>
            </div>
          </div>
        </div>
        
        {/* Integrated Scan Input */}
        <div className="mb-6">
          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.target.querySelector('input');
              if (input.value.trim()) {
                handleItemScan(input.value.trim());
                setInputValue('');
                input.value = '';
              }
            }}
            className="relative"
          >
            <div className="relative bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-1 rounded-xl">
            <div className="relative bg-gray-900 rounded-lg">
              {/* Animated scan icon */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.8, 1, 0.8],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="flex items-center justify-center"
                >
                  <ScanLine className={`transition-all duration-200 drop-shadow-lg ${
                    scanSuccess 
                      ? 'text-green-400' 
                      : scanError || scanRemoved
                      ? 'text-red-400' 
                      : 'text-blue-400'
                  }`} size={40} />
                </motion.div>
              </div>
              
              {/* Animated placeholder when empty */}
              {!inputValue && !scanSuccess && !scanError && !scanRemoved && (
                <AnimatePresence mode="wait">
                  <AnimatedPlaceholder />
                </AnimatePresence>
              )}
              
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder=""
                autoFocus={true}
                className={`w-full pl-20 pr-16 h-24 text-left bg-gray-800 border-2 ${
                  scanSuccess 
                    ? 'border-green-500 ring-4 ring-green-500/30 bg-green-900/60' 
                    : scanError || scanRemoved
                    ? 'border-red-500 ring-4 ring-red-500/30 bg-red-900/60' 
                    : 'border-blue-500 focus:ring-4 focus:ring-blue-500/40 focus:border-blue-500 hover:border-blue-400 hover:bg-gray-800/90'
                } rounded-xl text-white outline-none transition-all duration-200 text-3xl font-mono shadow-lg caret-blue-500`}
                style={{ lineHeight: '1.5' }}
              />
              
              {/* Status messages overlay */}
              {(scanSuccess || scanError || scanRemoved) && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`absolute left-[80px] text-3xl font-bold pointer-events-none ${
                    scanSuccess ? 'text-green-400' : 'text-red-400'
                  }`}
                  style={{ top: 'calc(50% - 12px)', transform: 'translateY(-50%)' }}
                >
                  {scanSuccess ? "Scanned!" : scanError ? "Invalid!" : "Removed!"}
                </motion.span>
              )}
              
              {/* Status indicator */}
              <motion.div
                className="absolute right-6 top-1/2 -translate-y-1/2"
                animate={
                  scanSuccess || scanError || scanRemoved
                    ? { scale: [0, 1.2, 1] }
                    : { opacity: [0.5, 1, 0.5] }
                }
                transition={
                  scanSuccess || scanError || scanRemoved
                    ? { duration: 0.3 }
                    : { duration: 2, repeat: Infinity }
                }
              >
                {scanSuccess ? (
                  <Check className="text-green-400" size={20} />
                ) : scanError ? (
                  <AlertTriangle className="text-red-400" size={20} />
                ) : scanRemoved ? (
                  <Minus className="text-red-400" size={20} />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${scanRemoved ? 'bg-red-400' : 'bg-blue-400'}`}></div>
                )}
              </motion.div>
            </div>
            </div>
          </motion.form>
          
          {scanError && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2">
              <AlertCircle className="text-red-400 flex-shrink-0" size={18} />
              <p className="text-red-300 text-base font-medium">{scanError}</p>
            </div>
          )}
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
                  onClick={(e) => {
                    // Prevent card click if clicking on interactive elements
                    const clickedElement = e.target;
                    const isInteractiveElement = 
                      clickedElement.closest('button') || 
                      clickedElement.closest('.no-card-click') ||
                      clickedElement.tagName === 'BUTTON' ||
                      clickedElement.tagName === 'INPUT' ||
                      clickedElement.closest('input');
                    
                    // Also prevent if we just closed an edit input
                    if (!isInteractiveElement && !isEditingRef.current) {
                      handleItemClick(item.id);
                    }
                    
                    // Reset the editing flag after a short delay
                    if (isEditingRef.current) {
                      setTimeout(() => {
                        isEditingRef.current = false;
                      }, 100);
                    }
                  }}
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
                  
                  <div className="absolute bottom-4 right-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
                    <span className="text-sm font-bold text-blue-300 flex items-center">
                      <MapPin className="mr-1" size={14} />
                      {item.binLocation}
                    </span>
                  </div>

                  {/* Selection Indicator */}
                  {selectedItemId === item.id && !isFullyPicked && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                      <motion.div 
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-yellow-500/50 flex items-center justify-center gap-1"
                      >
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          ⚡
                        </motion.div>
                        <span>Selected</span>
                      </motion.div>
                    </div>
                  )}

                  {/* Next Item Indicator - only hide if THIS item is selected */}
                  {(isNextToPick && !isFullyPicked && selectedItemId !== item.id) && (
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
                    <div className="flex justify-between items-start mb-4">
                      <div className={`flex-1 ${isFullyPicked ? 'opacity-60' : ''}`}>
                        <p className={`font-bold text-2xl mb-2 text-white ${isFullyPicked ? 'line-through' : ''}`}>{item.name}</p>
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
                            progress={pickedCount / item.quantity} 
                            size={60} 
                            strokeWidth={4}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {editingQuantity === item.id ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={item.quantity}
                                  value={tempQuantity}
                                  onChange={(e) => setTempQuantity(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      let newCount = parseInt(tempQuantity) || 0;
                                      
                                      // Cap the value to valid range
                                      if (newCount < 0) newCount = 0;
                                      if (newCount > item.quantity) newCount = item.quantity;
                                      
                                      // Update picked items to match new count
                                      const currentCount = getPickedCount(item.id);
                                      const diff = newCount - currentCount;
                                      if (diff > 0) {
                                        // Add items
                                        const newItems = Array(diff).fill(item.id);
                                        setPickedItems([...pickedItems, ...newItems]);
                                      } else if (diff < 0) {
                                        // Remove items
                                        const itemsToRemove = Math.abs(diff);
                                        const filteredItems = [...pickedItems];
                                        for (let i = 0; i < itemsToRemove; i++) {
                                          const index = filteredItems.lastIndexOf(item.id);
                                          if (index > -1) {
                                            filteredItems.splice(index, 1);
                                          }
                                        }
                                        setPickedItems(filteredItems);
                                      }
                                      playSound('success');
                                      setEditingQuantity(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingQuantity(null);
                                    }
                                  }}
                                  onBlur={() => {
                                    // Set flag to prevent card click
                                    isEditingRef.current = true;
                                    
                                    let newCount = parseInt(tempQuantity) || 0;
                                    
                                    // Cap the value to valid range
                                    if (newCount < 0) newCount = 0;
                                    if (newCount > item.quantity) newCount = item.quantity;
                                    
                                    // Update picked items to match new count
                                    const currentCount = getPickedCount(item.id);
                                    const diff = newCount - currentCount;
                                    if (diff > 0) {
                                      // Add items
                                      const newItems = Array(diff).fill(item.id);
                                      setPickedItems([...pickedItems, ...newItems]);
                                    } else if (diff < 0) {
                                      // Remove items
                                      const itemsToRemove = Math.abs(diff);
                                      const filteredItems = [...pickedItems];
                                      for (let i = 0; i < itemsToRemove; i++) {
                                        const index = filteredItems.lastIndexOf(item.id);
                                        if (index > -1) {
                                          filteredItems.splice(index, 1);
                                        }
                                      }
                                      setPickedItems(filteredItems);
                                    }
                                    if (diff !== 0) {
                                      playSound('success');
                                    }
                                    setEditingQuantity(null);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-12 px-1 py-0 text-center bg-gray-800 border border-blue-500 rounded text-white text-sm"
                                  autoFocus
                                />
                                <span className="text-white text-base">/{item.quantity}</span>
                              </div>
                            ) : (
                              <span 
                                className={`text-xl font-bold cursor-pointer hover:scale-110 transition-transform no-card-click ${
                                  isFullyPicked ? 'text-green-400' : 
                                  isPartiallyPicked ? 'text-yellow-400' : 
                                  'text-white'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingQuantity(item.id);
                                  setTempQuantity(pickedCount.toString());
                                  playSound('click');
                                }}
                                title="Click to edit quantity"
                              >
                                {pickedCount}/{item.quantity}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Quantity adjustment buttons */}
                        <div className="flex items-center space-x-2 relative z-10 no-card-click">
                          {/* Minus button to reduce picked quantity */}
                          {pickedCount > 0 && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleRemoveItem(item.id, e);
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                              }}
                              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/50 rounded-xl p-3 transition-all duration-300 hover:scale-110 relative z-20 cursor-pointer min-w-[56px] min-h-[56px] flex items-center justify-center"
                              onMouseEnter={() => playSound('hover')}
                              title="Remove one item"
                              type="button"
                            >
                              <Minus className="text-purple-400 pointer-events-none" size={28} />
                            </motion.button>
                          )}
                          
                          {/* Plus button in its natural position next to minus */}
                          <AnimatePresence mode="wait">
                            {!isFullyPicked && pickedCount < item.quantity && (
                              <motion.button
                                key={`plus-button-${item.id}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ 
                                  opacity: 1, 
                                  scale: 1
                                }}
                                exit={{ 
                                  opacity: 0,
                                  scale: 0.8,
                                  transition: { 
                                    duration: 0.15,
                                    ease: "easeOut"
                                  }
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleAddItem(item.id, e);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                }}
                                onMouseEnter={() => playSound('hover')}
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
                      
                      {/* Checkmark Button appears in the right position */}
                      <AnimatePresence mode="wait">
                        {isFullyPicked && (
                          <motion.div
                            key={`check-button-${item.id}`}
                            initial={{ 
                              opacity: 0,
                              scale: 0.8
                            }}
                            animate={{ 
                              opacity: 1, 
                              scale: 1,
                              transition: { 
                                duration: 0.2,
                                ease: "easeOut"
                              }
                            }}
                            exit={{ 
                              opacity: 0, 
                              scale: 0.8,
                              transition: {
                                duration: 0.15,
                                ease: "easeOut"
                              }
                            }}
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
                          <CheckCircle className="animate-pulse" size={18} />
                          <span className="font-semibold text-base">Complete</span>
                        </div>
                      </div>
                    ) : isPartiallyPicked ? (
                      <div className="mt-6 flex items-center justify-center">
                        <div className="flex items-center space-x-2 text-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <ScanLine className="animate-pulse" size={18} />
                          <span className="font-semibold text-base">Continue Picking</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 flex items-center justify-center">
                        <div className="flex items-center space-x-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <ScanLine className="animate-pulse" size={18} />
                          <span className="font-semibold text-base">Click to Pick</span>
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
              <p className="text-3xl font-bold">{pickedItems.length}</p>
              <p className="text-sm text-gray-400">Items Picked</p>
            </div>
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 text-center border border-white/10">
              <Package className="mx-auto mb-2 text-purple-400" size={24} />
              <p className="text-3xl font-bold">{totalItems}</p>
              <p className="text-sm text-gray-400">Total Items</p>
            </div>
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 text-center border border-white/10">
              <Layers className="mx-auto mb-2 text-yellow-400" size={24} />
              <p className="text-3xl font-bold">
                {order.items.filter(item => isItemFullyPicked(item.id)).length}/{order.items.length}
              </p>
              <p className="text-sm text-gray-400">SKUs Complete</p>
            </div>
          </div>

          {allItemsPicked && (
            <div className="mt-10 text-center">
              <div className="inline-flex items-center justify-center space-x-2 text-green-400 animate-pulse">
                <CheckCircle size={28} />
                <span className="text-xl font-semibold">All items picked! Completing order...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PickingScreen;