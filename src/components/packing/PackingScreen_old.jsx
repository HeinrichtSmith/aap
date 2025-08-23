import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Minus,
  Plus,
  Edit2,
  Clock,
  Check,
  AlertTriangle
} from 'lucide-react';

import ScanInput from '../ScanInput';
import PickingTimer from '../picking/PickingTimer';
import PriorityBadge from '../PriorityBadge';
import ProgressRing from '../ProgressRing.jsx';
import BackButton from '../BackButton';
import { playSound, initializeAudio, isAudioInitialized } from '../../utils/audio';
import { formatDate } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { useBatchedUpdates } from '../../hooks/useBatchedUpdates';
import PackingItem from './PackingItem';
import OptimizedPackingItem from './OptimizedPackingItem';
import VirtualGrid from '../VirtualGrid';

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

const PackingScreen = ({ tote, onComplete, initialScannedItems = [] }) => {
  const [scannedItems, setScannedItems] = useState(initialScannedItems);
  const [timerActive, setTimerActive] = useState(true);
  const [combo, setCombo] = useState(0);
  const [showComboAnimation, setShowComboAnimation] = useState(false);
  const [perfectStreak, setPerfectStreak] = useState(true);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanRemoved, setScanRemoved] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [finalTime, setFinalTime] = useState(null);
  const [audioStatus, setAudioStatus] = useState('not-initialized');
  const [removedItemId, setRemovedItemId] = useState(null);
  const [animatedItems, setAnimatedItems] = useState(new Set());
  const timerStopRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const completeSoundPlayedRef = useRef(false);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [tempQuantity, setTempQuantity] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [scannedItemId, setScannedItemId] = useState(null);
  const [hasAnimated, setHasAnimated] = useState(new Set());
  const editingRef = useRef(false);
  const scannedItemTimeoutRef = useRef(null);
  const removedItemTimeoutRef = useRef(null);
  
  const batchUpdates = useBatchedUpdates();
  const debouncedInputValue = useDebounce(inputValue, 150);

  // Memoized calculations for performance - moved before useEffect
  const totalItemCount = useMemo(() => {
    return tote.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [tote.items]);

  const scannedCounts = useMemo(() => {
    const counts = {};
    scannedItems.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [scannedItems]);

  const totalProgress = useMemo(() => {
    return scannedItems.length / totalItemCount;
  }, [scannedItems.length, totalItemCount]);

  const allItemsScanned = useMemo(() => {
    return tote.items.every(item => {
      const scannedCount = scannedCounts[item.id] || 0;
      return scannedCount >= item.quantity;
    });
  }, [tote.items, scannedCounts]);

  // Reset timer state when returning to packing screen
  useEffect(() => {
    if (allItemsScanned && initialScannedItems.length > 0) {
      timerStopRef.current = true;
      setTimerActive(false);
    }
  }, [allItemsScanned, initialScannedItems.length]);

  // Auto-select first incomplete item
  useEffect(() => {
    if (!selectedItemId && tote.items.length > 0) {
      const firstIncompleteItem = tote.items.find(item => {
        const scannedCount = scannedCounts[item.id] || 0;
        return scannedCount < item.quantity;
      });
      if (firstIncompleteItem) {
        setSelectedItemId(firstIncompleteItem.id);
      }
    }
  }, [selectedItemId, tote.items, scannedCounts]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scannedItemTimeoutRef.current) {
        clearTimeout(scannedItemTimeoutRef.current);
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

  // Memoized helper functions

  const getScannedCount = useCallback((itemId) => {
    return scannedCounts[itemId] || 0;
  }, [scannedCounts]);

  const isItemFullyScanned = useCallback((itemId) => {
    const item = tote.items.find(i => i.id === itemId);
    const scannedCount = scannedCounts[itemId] || 0;
    return scannedCount >= item.quantity;
  }, [tote.items, scannedCounts]);

  const isItemPartiallyScanned = useCallback((itemId) => {
    const scannedCount = scannedCounts[itemId] || 0;
    return scannedCount > 0 && !isItemFullyScanned(itemId);
  }, [scannedCounts, isItemFullyScanned]);

  const validateScan = (scannedSKU) => {
    const item = tote.items.find(i => i.id === scannedSKU);
    if (!item) return false;
    
    const scannedCount = scannedItems.filter(id => id === scannedSKU).length;
    if (scannedCount >= item.quantity) return false;
    
    return true;
  };

  const handleItemScan = useCallback((scannedSKU) => {
    hasInteractedRef.current = true;
    
    const item = tote.items.find(i => i.id === scannedSKU);
    if (!item) {
      batchUpdates(() => {
        setCombo(0);
        setPerfectStreak(false);
        setScanError(`Invalid item! "${scannedSKU}" is not in this order.`);
        setScanSuccess(false);
        setScanRemoved(false);
      });
      setTimeout(() => setScanError(''), 3000);
      playSound('error');
      return;
    }

    const scannedCount = scannedCounts[scannedSKU] || 0;
    if (scannedCount >= item.quantity) {
      batchUpdates(() => {
        setScanError(`Already scanned all ${item.quantity} of ${item.name}`);
        setScanSuccess(false);
        setScanRemoved(false);
      });
      setTimeout(() => setScanError(''), 3000);
      playSound('error');
      return;
    }

    const newScannedItems = [...scannedItems, scannedSKU];
    const newCombo = combo + 1;
    
    batchUpdates(() => {
      setScannedItems(newScannedItems);
      setCombo(newCombo);
      setScanError('');
      setScanSuccess(true);
      setScanRemoved(false);
      setSelectedItemId(scannedSKU);
    });
    
    setTimeout(() => setScanSuccess(false), 1500);
    
    if (newCombo > 0 && newCombo % 5 === 0) {
      setShowComboAnimation(true);
      playSound('combo');
      setTimeout(() => setShowComboAnimation(false), 1000);
    }
    
    const allScanned = tote.items.every(item => {
      const count = newScannedItems.filter(id => id === item.id).length;
      return count >= item.quantity;
    });

    if (allScanned && !timerStopRef.current) {
      timerStopRef.current = true;
      setTimerActive(false);
    }
  }, [tote.items, scannedCounts, scannedItems, combo, batchUpdates]);

  const handleItemClick = useCallback((itemId) => {
    if (selectedItemId !== itemId) {
      setSelectedItemId(itemId);
      playSound('click');
      return;
    }

    const item = tote.items.find(item => item.id === itemId);
    if (item) {
      const scannedCount = getScannedCount(itemId);
      if (scannedCount < item.quantity) {
        handleItemScan(itemId);
        playSound('success');
      } else {
        playSound('error');
      }
    }
  }, [selectedItemId, tote.items, getScannedCount, handleItemScan]);
  
  // Auto-scan when debounced input is valid - moved after handleItemScan definition
  useEffect(() => {
    if (debouncedInputValue && debouncedInputValue.trim() && debouncedInputValue.length >= 3) {
      // Auto-scan if input looks like a barcode (all digits or alphanumeric)
      const barcodePattern = /^[A-Za-z0-9]+$/;
      if (barcodePattern.test(debouncedInputValue.trim())) {
        const timeout = setTimeout(() => {
          handleItemScan(debouncedInputValue.trim());
          setInputValue('');
        }, 500); // Small delay to allow for corrections
        
        return () => clearTimeout(timeout);
      }
    }
  }, [debouncedInputValue, handleItemScan]);

  const handleReduceItem = useCallback((itemId, e) => {
    e.stopPropagation();
    hasInteractedRef.current = true;
    
    const scannedCount = scannedCounts[itemId] || 0;
    if (scannedCount > 0) {
      const lastIndex = scannedItems.lastIndexOf(itemId);
      if (lastIndex > -1) {
        const newScannedItems = [...scannedItems];
        newScannedItems.splice(lastIndex, 1);
        
        batchUpdates(() => {
          setScannedItems(newScannedItems);
          setSelectedItemId(itemId);
          setRemovedItemId(itemId);
          setScanRemoved(true);
          setScanError('');
          setScanSuccess(false);
          setCombo(0);
          setPerfectStreak(false);
        });
        
        playSound('error');
        
        // Clear any existing timeout before setting new one
        if (removedItemTimeoutRef.current) {
          clearTimeout(removedItemTimeoutRef.current);
        }
        removedItemTimeoutRef.current = setTimeout(() => {
          setRemovedItemId(null);
          removedItemTimeoutRef.current = null;
        }, 500);
        setTimeout(() => setScanRemoved(false), 1500);
        
        const stillAllScanned = tote.items.every(item => {
          const count = newScannedItems.filter(id => id === item.id).length;
          return count >= item.quantity;
        });
        
        if (!stillAllScanned && timerStopRef.current) {
          timerStopRef.current = false;
          setTimerActive(true);
          setFinalTime(null);
          completeSoundPlayedRef.current = false;
        }
      }
    }
  }, [scannedCounts, scannedItems, tote.items, batchUpdates]);

  const handleAddItem = useCallback((itemId, e) => {
    if (e) e.stopPropagation();
    hasInteractedRef.current = true;
    
    const item = tote.items.find(i => i.id === itemId);
    const scannedCount = scannedCounts[itemId] || 0;
    
    if (scannedCount < item.quantity) {
      const newScannedItems = [...scannedItems, itemId];
      
      batchUpdates(() => {
        setScannedItems(newScannedItems);
        setCombo(prev => prev + 1);
        setScanSuccess(true);
        setScanError('');
        setScanRemoved(false);
        setSelectedItemId(itemId);
        setScannedItemId(itemId);
      });
      
      playSound('success');
      setTimeout(() => setScanSuccess(false), 1500);
      // Clear any existing timeout before setting new one
      if (scannedItemTimeoutRef.current) {
        clearTimeout(scannedItemTimeoutRef.current);
      }
      scannedItemTimeoutRef.current = setTimeout(() => {
        setScannedItemId(null);
        scannedItemTimeoutRef.current = null;
      }, 500);
      
      const allScanned = tote.items.every(item => {
        const count = newScannedItems.filter(id => id === item.id).length;
        return count >= item.quantity;
      });

      if (allScanned && !timerStopRef.current) {
        timerStopRef.current = true;
        setTimerActive(false);
      }
    } else {
      playSound('error');
    }
  }, [tote.items, scannedCounts, scannedItems, batchUpdates]);

  const handleEditQuantity = useCallback((itemId, newCount) => {
    if (newCount === undefined) {
      setEditingQuantity(itemId);
      return;
    }
    
    if (newCount === null) {
      setEditingQuantity(null);
      return;
    }
    
    const item = tote.items.find(i => i.id === itemId);
    if (!item) return;
    
    const currentScannedCount = scannedCounts[itemId] || 0;
    let newScannedItems = [...scannedItems];
    
    if (newCount > currentScannedCount) {
      for (let i = currentScannedCount; i < newCount; i++) {
        newScannedItems.push(itemId);
      }
    } else if (newCount < currentScannedCount) {
      for (let i = currentScannedCount; i > newCount; i--) {
        const lastIndex = newScannedItems.lastIndexOf(itemId);
        if (lastIndex > -1) {
          newScannedItems.splice(lastIndex, 1);
        }
      }
    }
    
    setScannedItems(newScannedItems);
    setEditingQuantity(null);
    
    const allScanned = tote.items.every(item => {
      const count = newScannedItems.filter(id => id === item.id).length;
      return count >= item.quantity;
    });

    if (allScanned && !timerStopRef.current) {
      timerStopRef.current = true;
      setTimerActive(false);
    } else if (!allScanned && timerStopRef.current) {
      timerStopRef.current = false;
      setTimerActive(true);
      setFinalTime(null);
      completeSoundPlayedRef.current = false;
    }
  }, [tote.items, scannedCounts, scannedItems]);

  const handleQuantitySave = useCallback((itemId, e) => {
    e.stopPropagation();
    
    const item = tote.items.find(i => i.id === itemId);
    const newQuantity = parseInt(tempQuantity, 10);
    
    if (isNaN(newQuantity) || newQuantity < 0) {
      playSound('error');
      setEditingQuantity(null);
      return;
    }
    
    if (newQuantity > item.quantity) {
      playSound('error');
      setTempQuantity(item.quantity.toString());
      return;
    }
    
    const currentScannedCount = scannedCounts[itemId] || 0;
    let newScannedItems = [...scannedItems];
    
    if (newQuantity > currentScannedCount) {
      for (let i = currentScannedCount; i < newQuantity; i++) {
        newScannedItems.push(itemId);
      }
    } else if (newQuantity < currentScannedCount) {
      for (let i = currentScannedCount; i > newQuantity; i--) {
        const lastIndex = newScannedItems.lastIndexOf(itemId);
        if (lastIndex > -1) {
          newScannedItems.splice(lastIndex, 1);
        }
      }
    }
    
    setScannedItems(newScannedItems);
    setEditingQuantity(null);
    playSound('success');
    
    const allScanned = tote.items.every(item => {
      const count = newScannedItems.filter(id => id === item.id).length;
      return count >= item.quantity;
    });

    if (allScanned && !timerStopRef.current) {
      timerStopRef.current = true;
      setTimerActive(false);
    } else if (!allScanned && timerStopRef.current) {
      timerStopRef.current = false;
      setTimerActive(true);
      setFinalTime(null);
      completeSoundPlayedRef.current = false;
    }
  }, [tote.items, tempQuantity, scannedCounts, scannedItems]);

  const handleQuantityCancel = useCallback((e) => {
    e.stopPropagation();
    setEditingQuantity(null);
    setTempQuantity('');
    playSound('click');
  }, []);

  const handleFinishPacking = useCallback((seconds) => {
    setFinalTime(seconds);
  }, []);

  useEffect(() => {
    if (!hasInteractedRef.current) return;
    
    if (allItemsScanned && finalTime !== null && !completeSoundPlayedRef.current) {
      completeSoundPlayedRef.current = true;
      setTimeout(() => {
        playSound('complete');
        onComplete({ time: finalTime, perfectStreak, combo, scannedItems });
      }, 500);
    } else if (allItemsScanned && finalTime === null) {
      setTimeout(() => {
        if (finalTime === null) {
          setFinalTime(0);
        }
      }, 500);
    }
  }, [allItemsScanned, finalTime, perfectStreak, combo, scannedItems, onComplete]);

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
      
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 border-2 border-blue-500/50 relative">
        {/* Priority badge and timer on top of card */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center space-x-4" style={{ top: '-20px' }}>
          {tote.priority && (
            <PriorityBadge priority={tote.priority} size="lg" />
          )}
          {/* Timer next to priority badge - matching priority badge style */}
          <div className="px-4 py-2 text-base rounded-full font-bold border flex items-center gap-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-500/50 shadow-lg shadow-blue-500/50 whitespace-nowrap">
            <Clock size={18} />
            <PickingTimer 
              isActive={timerActive} 
              onComplete={handleFinishPacking}
              compact={true}
              color="blue"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6 mt-8">
          <div className="flex items-center space-x-6 min-w-0 flex-1">
            <div className="flex items-center space-x-4 whitespace-nowrap">
              <h2 className="text-3xl font-bold text-white flex items-center whitespace-nowrap">
                <Package className="mr-2 text-blue-400" size={28} />
                Items to Pack
              </h2>
              <span className="text-2xl text-gray-400 flex items-center whitespace-nowrap">
                <Barcode className="mr-1" size={28} />
                Order: <span className="font-bold text-white ml-1">{tote.orderId}</span>
              </span>
              <span className="text-2xl text-gray-400 flex items-center whitespace-nowrap">
                <CalendarDays className="mr-1" size={28} />
                Picked: <span className="font-bold text-white ml-1">{formatDate(tote.pickedDate)}</span>
              </span>
            </div>
          </div>
          
          {/* Packing progress - LARGER */}
          <div className="relative w-48 h-10 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 border-2 border-blue-500/50">
            <motion.div 
              className="absolute inset-0 h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white z-10">
                {scannedItems.length}/{totalItemCount}
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
                  <AlertCircle className="text-red-400" size={20} />
                ) : scanRemoved ? (
                  <Minus className="text-yellow-400" size={20} />
                ) : (
                  <Target className="text-blue-400" size={20} />
                )}
              </motion.div>
            </div>
            </div>
          </motion.form>
        </div>
        
        {/* Use virtual scrolling for large item lists */}
        {tote.items.length > 20 ? (
          <VirtualGrid
            items={tote.items}
            itemHeight={280}
            containerHeight={600}
            itemsPerRow={3}
            gap={16}
            renderItem={(item, index) => {
              const scannedCount = getScannedCount(item.id);
              const isFullyScanned = isItemFullyScanned(item.id);
              const isPartiallyScanned = isItemPartiallyScanned(item.id);
              const itemHasAnimated = hasAnimated.has(item.id);
              
              return (
                <OptimizedPackingItem
                  key={item.id}
                  item={item}
                  scannedCount={scannedCount}
                  isSelected={selectedItemId === item.id}
                  isFullyScanned={isFullyScanned}
                  isPartiallyScanned={isPartiallyScanned}
                  isNextToPack={false}
                  hasAnimated={itemHasAnimated}
                  index={index}
                  removedItemId={removedItemId}
                  scannedItemId={scannedItemId}
                  editingQuantity={editingQuantity}
                  tempQuantity={tempQuantity}
                  onItemClick={handleItemClick}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleReduceItem}
                  onEditQuantity={handleEditQuantity}
                  onTempQuantityChange={setTempQuantity}
                  onEditingRef={editingRef}
                />
              );
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tote.items.map((item, index) => {
              const scannedCount = getScannedCount(item.id);
              const isFullyScanned = isItemFullyScanned(item.id);
              const isPartiallyScanned = isItemPartiallyScanned(item.id);
              const itemHasAnimated = hasAnimated.has(item.id);
              
              return (
                <OptimizedPackingItem
                  key={item.id}
                  item={item}
                  scannedCount={scannedCount}
                  isSelected={selectedItemId === item.id}
                  isFullyScanned={isFullyScanned}
                  isPartiallyScanned={isPartiallyScanned}
                  isNextToPack={false}
                  hasAnimated={itemHasAnimated}
                  index={index}
                  removedItemId={removedItemId}
                  scannedItemId={scannedItemId}
                  editingQuantity={editingQuantity}
                  tempQuantity={tempQuantity}
                  onItemClick={handleItemClick}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleReduceItem}
                  onEditQuantity={handleEditQuantity}
                  onTempQuantityChange={setTempQuantity}
                  onEditingRef={editingRef}
                />
              );
            })}
          </div>
        )}

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-6 text-center border border-white/10">
            <BarChart3 className="mx-auto mb-3 text-blue-400" size={32} />
            <p className="text-4xl font-bold">{scannedItems.length}</p>
            <p className="text-base text-gray-400">Items Scanned</p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-6 text-center border border-white/10">
            <Package className="mx-auto mb-3 text-purple-400" size={32} />
            <p className="text-4xl font-bold">{totalItemCount}</p>
            <p className="text-base text-gray-400">Total Items</p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-6 text-center border border-white/10">
            <Layers className="mx-auto mb-3 text-yellow-400" size={32} />
            <p className="text-4xl font-bold">{tote.items.filter(item => isItemFullyScanned(item.id)).length}/{tote.items.length}</p>
            <p className="text-base text-gray-400">SKUs Complete</p>
          </div>
        </div>

        {allItemsScanned && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center justify-center space-x-2 text-green-400 animate-pulse">
              <CheckCircle size={28} />
              <span className="text-xl font-semibold">All items packed! Moving to packaging...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackingScreen;