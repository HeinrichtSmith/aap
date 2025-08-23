import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
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
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Box,
  Sparkles,
  TrendingUp,
  Activity,
  GripVertical,
  X,
  RefreshCw
} from 'lucide-react';

import PickingTimer from '../picking/PickingTimer';
import PriorityBadge from '../PriorityBadge';
import ProgressRing from '../ProgressRing.jsx';
import GameIcon from '../GameIcon';
import BackButton from '../BackButton';
import { playSound, initializeAudio, isAudioInitialized } from '../../utils/audio';
import { formatDate, formatTime } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { useBatchedUpdates } from '../../hooks/useBatchedUpdates';
import OptimizedPackingItem from './OptimizedPackingItem';
import VirtualGrid from '../VirtualGrid';
import { getItemIconType } from '../../config/gameIconConstants';

// Helper function to render mixed GameIcons
const renderMixedGameIcons = (items, totalCount, size = 48, isForTierGuide = false) => {
  if (totalCount === 0) {
    return (
      <GameIcon 
        iconType="box"
        iconCount={1}
        actualQuantity={1}
        size={size}
        iconSize="medium"
        showBadge={false}
        tier="standard"
      />
    );
  }
  
  const uniqueItemTypes = [...new Set(items.map(item => getItemIconType(item.name, item.id)))];
  const displayTypes = uniqueItemTypes.slice(0, 4);
  
  let forcedTier = null;
  if (totalCount === 1) forcedTier = 'normal';
  else if (totalCount === 5) forcedTier = 'standard';
  else if (totalCount === 25) forcedTier = 'super';
  else if (totalCount === 125) forcedTier = 'mega';
  
  if (isForTierGuide && forcedTier) {
    return (
      <GameIcon 
        iconType="box"
        iconCount={1}
        actualQuantity={1}
        size={size}
        iconSize="medium"
        showBadge={false}
        mixedIconTypes={displayTypes}
        tier={forcedTier}
      />
    );
  }
  
  return (
    <GameIcon 
      iconType="box"
      iconCount={totalCount}
      actualQuantity={totalCount}
      size={size}
      iconSize="medium"
      showBadge={false}
      mixedIconTypes={displayTypes}
      tier={forcedTier}
    />
  );
};

// Animated barcode visual
const AnimatedBarcode = ({ color = "bg-blue-400" }) => (
  <div className="flex items-center space-x-1 ml-2">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className={color}
        style={{ 
          width: Math.random() > 0.5 ? '2px' : '4px',
          height: '20px'
        }}
        animate={{ 
          opacity: [0.3, 1, 0.3],
          scaleY: [0.8, 1.2, 0.8]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.1,
          ease: "easeInOut"
        }}
      />
    ))}
  </div>
);

// Animated placeholder component
const AnimatedPlaceholder = ({ inputValue, isTyping, isFocused, justClicked }) => {
  const placeholderTexts = [
    "Scan the barcodes! ⚡",
    "Ready for packing...",
    "Scanner ready for items",
    "Loading packing mode...",
    "Waiting for items..."
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
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 0.9, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="absolute font-bold pointer-events-none flex items-center drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] text-4xl text-blue-400"
      style={{ 
        left: '80px', 
        top: 'calc(50% - 14px)', 
        transform: 'translateY(-50%)',
        maxWidth: 'calc(100% - 160px)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
    >
      {placeholderTexts[currentIndex]}<WaveDots />
    </motion.span>
  );
};

const PackingScreen = memo(({ tote, onComplete, initialScannedItems = [], onBack }) => {
  // Define DROP_ZONE_SIZE first
  const DROP_ZONE_WIDTH = window.innerWidth * 0.48;
  const DROP_ZONE_HEIGHT = window.innerHeight * 0.45;
  const DROP_ZONE_HEIGHT_TALL = window.innerHeight * 0.9;
  
  // Pre-allocated spots system
  const SPOTS = useMemo(() => [
    // Top left corner - Items to Pack (TALL)
    { id: 'top-left', x: 20, y: 80, absolute: true, width: Math.floor(DROP_ZONE_WIDTH), height: Math.floor(DROP_ZONE_HEIGHT_TALL) },
    
    // Top right corner - Packed Items
    { id: 'top-right', x: Math.floor(window.innerWidth - DROP_ZONE_WIDTH - 20), y: 80, absolute: true, width: Math.floor(DROP_ZONE_WIDTH), height: Math.floor(DROP_ZONE_HEIGHT) },
    
    // Bottom right corner - Metrics
    { id: 'bottom-right', x: Math.floor(window.innerWidth - DROP_ZONE_WIDTH - 20), y: Math.floor(window.innerHeight - DROP_ZONE_HEIGHT - 20), absolute: true, width: Math.floor(DROP_ZONE_WIDTH), height: Math.floor(DROP_ZONE_HEIGHT) },
  ], [DROP_ZONE_WIDTH, DROP_ZONE_HEIGHT, DROP_ZONE_HEIGHT_TALL]);
  
  const [scannedItems, setScannedItems] = useState(initialScannedItems);
  const [timerActive, setTimerActive] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showComboAnimation, setShowComboAnimation] = useState(false);
  const [perfectStreak, setPerfectStreak] = useState(true);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanRemoved, setScanRemoved] = useState(false);
  const [audioStatus, setAudioStatus] = useState('unknown');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isInteractingWithItem, setIsInteractingWithItem] = useState(false);
  const [removedItemId, setRemovedItemId] = useState(null);
  const [scannedItemId, setScannedItemId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [tempQuantity, setTempQuantity] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showPackedItems, setShowPackedItems] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showItemsToPack, setShowItemsToPack] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [justClicked, setJustClicked] = useState(false);
  
  // Dropzone contents state
  const [dropzoneContents, setDropzoneContents] = useState({
    'top': 'itemsToPack',
    'bottom-left': 'packedItems',
    'bottom-right': 'metrics'
  });
  
  // Drag states
  const [draggingSection, setDraggingSection] = useState(null);
  const [dragOverZone, setDragOverZone] = useState(null);
  const [dragTransform, setDragTransform] = useState({ scale: 1, x: 0, y: 0 });
  
  // Dropzone sizes state - user adjustable
  const [dropzoneSizes, setDropzoneSizes] = useState({
    'top': { width: '100%', height: window.innerHeight * 0.5 },
    'bottom-left': { width: '100%', height: window.innerHeight * 0.4 },
    'bottom-right': { width: '100%', height: window.innerHeight * 0.4 }
  });
  
  // Resize states
  const [resizingZone, setResizingZone] = useState(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  
  const timerStopRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const completeSoundPlayedRef = useRef(false);
  const isEditingRef = useRef(false);
  const scannedItemTimeoutRef = useRef(null);
  const removedItemTimeoutRef = useRef(null);
  const scanSuccessTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const handleRemoveItemRef = useRef(null);
  const dragElementRefs = useRef({});
  const isCompletingRef = useRef(false);
  
  const batchUpdates = useBatchedUpdates();
  const debouncedInputValue = useDebounce(inputValue, 150);
  
  // Timer tracking
  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerActive]);

  // Safety timeout to clear dragging state if it gets stuck
  useEffect(() => {
    if (draggingSection) {
      const timeout = setTimeout(() => {
        console.warn('Clearing stuck dragging state after timeout');
        setDraggingSection(null);
        setDragOverZone(null);
        setDragTransform({ scale: 1, x: 0, y: 0 });
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [draggingSection]);
  
  // Global handlers to clear stuck dragging state
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && draggingSection) {
        console.log('Clearing dragging state via Escape key');
        setDraggingSection(null);
        setDragOverZone(null);
        setDragTransform({ scale: 1, x: 0, y: 0 });
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [draggingSection]);

  // Manage body class during drag operations to prevent stacking context issues
  useEffect(() => {
    if (draggingSection) {
      document.body.classList.add('dragging');
    } else {
      document.body.classList.remove('dragging');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('dragging');
    };
  }, [draggingSection]);
  
  // Memoized calculations
  const totalItems = useMemo(() => {
    return tote.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [tote.items]);
  
  const totalScanned = useMemo(() => {
    return scannedItems.length;
  }, [scannedItems.length]);
  
  const scannedCounts = useMemo(() => {
    const counts = {};
    scannedItems.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [scannedItems]);
  
  const totalScannedForProgress = useMemo(() => {
    return tote.items.reduce((sum, item) => {
      const scannedCount = scannedCounts[item.id] || 0;
      return sum + Math.min(scannedCount, item.quantity);
    }, 0);
  }, [tote.items, scannedCounts]);
  
  const allItemsPacked = useMemo(() => {
    return tote.items.every(item => {
      const scannedCount = scannedCounts[item.id] || 0;
      return scannedCount >= item.quantity;
    });
  }, [tote.items, scannedCounts]);
  
  // Separate packed and unpacked items
  const { packedItems, unpackedItems } = useMemo(() => {
    const packed = [];
    const unpacked = [];
    
    tote.items.forEach(item => {
      const scannedCount = scannedCounts[item.id] || 0;
      if (scannedCount >= item.quantity) {
        packed.push(item);
      } else {
        unpacked.push(item);
      }
    });
    
    return { packedItems: packed, unpackedItems: unpacked };
  }, [tote.items, scannedCounts]);
  
  const orderProgress = useMemo(() => {
    return totalItems > 0 ? (totalScannedForProgress / totalItems) * 100 : 0;
  }, [totalItems, totalScannedForProgress]);
  
  // Expose data to navigation bar
  useEffect(() => {
    window.packingPageData = {
      orderId: tote?.orderId || tote?.id,
      customer: tote?.customer,
      timerDisplay: formatTime(timerSeconds),
      timerActive: timerActive,
      totalScanned: totalScannedForProgress,
      totalItems: totalItems,
      remainingItems: totalItems - totalScannedForProgress,
      orderProgress: orderProgress,
      onBack: onBack,
      isPackingScreen: true
    };
    
    return () => {
      if (!isCompletingRef.current) {
        delete window.packingPageData;
      }
    };
  }, [tote?.orderId, tote?.id, tote?.customer, timerSeconds, timerActive, 
      totalScannedForProgress, totalItems, orderProgress, onBack]);
  
  // Check if a section is minimized
  const isSectionMinimized = useCallback((sectionId) => {
    switch (sectionId) {
      case 'itemsToPack':
        return !showItemsToPack;
      case 'packedItems':
        return !showPackedItems;
      case 'metrics':
        return !showMetrics;
      default:
        return false;
    }
  }, [showItemsToPack, showPackedItems, showMetrics]);

  // Handle resize start
  const handleResizeStart = useCallback((e, zoneId) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingZone(zoneId);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartSize({ 
      width: parseFloat(dropzoneSizes[zoneId].width) || 100,
      height: dropzoneSizes[zoneId].height 
    });
  }, [dropzoneSizes]);
  
  // Handle resize move
  useEffect(() => {
    if (!resizingZone) return;
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - resizeStartPos.x;
      const deltaY = e.clientY - resizeStartPos.y;
      
      const newWidth = Math.max(300, Math.min(window.innerWidth * 0.9, resizeStartSize.width + deltaX));
      const newHeight = Math.max(
        isSectionMinimized(dropzoneContents[resizingZone]) ? 120 : 250,
        Math.min(window.innerHeight * 0.9, resizeStartSize.height + deltaY)
      );
      
      setDropzoneSizes(prev => ({
        ...prev,
        [resizingZone]: { width: `${newWidth}px`, height: `${newHeight}px` }
      }));
    };
    
    const handleMouseUp = () => {
      setResizingZone(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingZone, resizeStartPos, resizeStartSize, dropzoneContents, isSectionMinimized]);
  
  // Get current zone for a section
  const getCurrentZone = useCallback((sectionId) => {
    for (const [zone, section] of Object.entries(dropzoneContents)) {
      if (section === sectionId) return zone;
    }
    return null;
  }, [dropzoneContents]);
  
  // Handle section swap
  const handleSectionSwap = useCallback((targetZone, draggedSection) => {
    setDropzoneContents(prev => {
      const newContents = { ...prev };
      
      let sourceZone = null;
      Object.entries(prev).forEach(([zone, section]) => {
        if (section === draggedSection) {
          sourceZone = zone;
        }
      });
      
      if (sourceZone && sourceZone !== targetZone) {
        const targetSection = prev[targetZone];
        newContents[targetZone] = draggedSection;
        newContents[sourceZone] = targetSection;
        playSound('success');
      }
      
      return newContents;
    });
  }, []);
  
  // Handle drag end
  const handleDragEndWithZoneDetection = useCallback((event, info, sectionId) => {
    try {
      const pointerX = event.clientX || 0;
      const pointerY = event.clientY || 0;
      
      const dropzones = document.querySelectorAll('[data-dropzone]');
      let targetZone = null;
      
      dropzones.forEach(zone => {
        const zoneRect = zone.getBoundingClientRect();
        if (pointerX >= zoneRect.left && pointerX <= zoneRect.right &&
            pointerY >= zoneRect.top && pointerY <= zoneRect.bottom) {
          targetZone = zone.getAttribute('data-dropzone');
        }
      });
      
      if (targetZone && dropzoneContents.hasOwnProperty(targetZone)) {
        const currentZone = getCurrentZone(sectionId);
        if (targetZone !== currentZone) {
          handleSectionSwap(targetZone, sectionId);
          return true;
        }
      }
      
      return false;
    } finally {
      setDraggingSection(null);
      setDragOverZone(null);
      setDragTransform({ scale: 1, x: 0, y: 0 });
    }
  }, [getCurrentZone, handleSectionSwap, dropzoneContents]);
  
  // Handle typing detection
  useEffect(() => {
    if (inputValue.length > 0) {
      setIsTyping(true);
      const timeout = setTimeout(() => {
        if (inputValue.length === 0) {
          setIsTyping(false);
        }
      }, 1000);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [inputValue]);
  
  // Handle click feedback
  useEffect(() => {
    if (justClicked) {
      const timeout = setTimeout(() => {
        setJustClicked(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [justClicked]);
  
  // Get dropzone transform
  const getDropzoneTransform = useCallback((targetZone, currentZone) => {
    const scale = (() => {
      switch (targetZone) {
        case 'top':
          return 0.8;
        case 'bottom-left':
        case 'bottom-right':
          return 1.3;
        default:
          return 1.05;
      }
    })();
    return { scale, x: 0, y: 0 };
  }, []);
  
  // Handle refreshing sections
  const handleRefreshSection = useCallback((sectionId) => {
    playSound('click');
    
    switch (sectionId) {
      case 'itemsToPack':
        // Refresh items to pack - reset scanned counts and re-render
        const refreshedScannedCounts = {};
        tote.items.forEach(item => {
          const scannedCount = scannedCounts[item.id] || 0;
          refreshedScannedCounts[item.id] = scannedCount;
        });
        setScannedCounts({ ...refreshedScannedCounts });
        break;
        
      case 'packedItems':
        // Force re-render of packed items
        setShowPackedItems(false);
        setTimeout(() => setShowPackedItems(true), 100);
        break;
        
      case 'metrics':
        // Force re-render of metrics
        setShowMetrics(false);
        setTimeout(() => setShowMetrics(true), 100);
        break;
        
      default:
        break;
    }
  }, [tote.items, scannedCounts]);

  // Handle scan submit
  const handleScanSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!debouncedInputValue.trim()) return;
    
    const scannedSKU = debouncedInputValue.toUpperCase();
    const matchingItem = tote.items.find(item => item.id === scannedSKU);
    
    if (matchingItem) {
      const currentlyScanned = scannedCounts[scannedSKU] || 0;
      const remainingToScan = matchingItem.quantity - currentlyScanned;
      
      if (remainingToScan > 0) {
        setScanSuccess(true);
        setScannedItemId(scannedSKU);
        setTimeout(() => setScannedItemId(null), 350);
        
        const newScannedItems = [...scannedItems, scannedSKU];
        
        const allPacked = tote.items.every(item => {
          const count = newScannedItems.filter(id => id === item.id).length;
          return count >= item.quantity;
        });
        
        if (allPacked && !timerStopRef.current) {
          timerStopRef.current = true;
          setTimerActive(false);
        }
        
        batchUpdates(() => {
          setScannedItems(newScannedItems);
          setInputValue('');
          setScanSuccess(true);
          if (scanSuccessTimeoutRef.current) clearTimeout(scanSuccessTimeoutRef.current);
          scanSuccessTimeoutRef.current = setTimeout(() => setScanSuccess(false), 1500);
          
          if (remainingToScan === 1) {
            playSound('complete');
            setSelectedItemId(null);
            
            const nextIncompleteItem = tote.items.find(item => {
              if (item.id === scannedSKU) return false;
              const scannedCount = item.id === scannedSKU ? currentlyScanned + 1 : (scannedCounts[item.id] || 0);
              return scannedCount < item.quantity;
            });
            
            if (nextIncompleteItem) {
              setSelectedItemId(nextIncompleteItem.id);
            }
          } else {
            playSound('scan');
          }
          
          setCombo(prev => prev + 1);
          setShowComboAnimation(true);
          setTimeout(() => setShowComboAnimation(false), 1000);
        });
      } else {
        // Already fully scanned
        batchUpdates(() => {
          setScanError('Item already fully scanned');
          playSound('error');
          setInputValue('');
          setTimeout(() => setScanError(''), 2000);
        });
      }
    } else {
      // Invalid barcode
      batchUpdates(() => {
        setScanError('Invalid barcode - not in this order');
        playSound('error');
        setInputValue('');
        setPerfectStreak(false);
        setTimeout(() => setScanError(''), 2000);
      });
    }
  }, [debouncedInputValue, tote.items, scannedCounts, scannedItems, batchUpdates]);
  
  // Handle add item (for plus button or double click)
  const handleAddItem = useCallback((itemId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const item = tote.items.find(i => i.id === itemId);
    const currentCount = scannedCounts[itemId] || 0;
    
    if (currentCount < item.quantity) {
      batchUpdates(() => {
        setScannedItems(prev => [...prev, itemId]);
        setScanError('');
        setScanRemoved(false);
        setScannedItemId(itemId);
        setSelectedItemId(itemId);
      });
      
      // Clear scan success after delay
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      scanTimeoutRef.current = setTimeout(() => {
        setScannedItemId(null);
      }, 350);
      
      playSound('success');
      
      // Stop timer on first scan
      if (!timerActive && scannedItems.length === 0) {
        setTimerActive(false);
      }
    } else {
      playSound('error');
    }
  }, [tote.items, scannedCounts, scannedItems, timerActive, batchUpdates]);

  // Handle item click
  const handleItemClick = useCallback((itemId) => {
    const item = tote.items.find(i => i.id === itemId);
    if (!item) return;

    const scannedCount = scannedCounts[itemId] || 0;
    
    // If item is fully scanned, just play error sound
    if (scannedCount >= item.quantity) {
      playSound('error');
      return;
    }
    
    // First click: select the item
    if (selectedItemId !== itemId) {
      setSelectedItemId(itemId);
      playSound('click');
    } else {
      // Second click: scan one unit
      handleAddItem(itemId);
    }
  }, [selectedItemId, tote.items, scannedCounts, handleAddItem]);

  // Handle remove item
  const handleRemoveItem = useCallback((itemId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    const itemIndex = scannedItems.lastIndexOf(itemId);
    if (itemIndex !== -1) {
      const newScannedItems = [...scannedItems];
      newScannedItems.splice(itemIndex, 1);
      
      setScannedItems(newScannedItems);
      setRemovedItemId(itemId);
      setScanRemoved(true);
      
      if (removedItemTimeoutRef.current) {
        clearTimeout(removedItemTimeoutRef.current);
      }
      
      removedItemTimeoutRef.current = setTimeout(() => {
        setRemovedItemId(null);
      }, 350);
      
      setTimeout(() => setScanRemoved(false), 1500);
      playSound('error');
      
      if (timerStopRef.current) {
        timerStopRef.current = false;
        setTimerActive(true);
      }
    }
  }, [scannedItems]);

  // Handle edit quantity 
  const handleEditQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity === undefined) {
      // Start edit mode
      setEditingQuantity(itemId);
      setSelectedItemId(itemId);
      const currentCount = scannedCounts[itemId] || 0;
      setTempQuantity(currentCount.toString());
      return;
    }
    
    // Finish edit mode and apply the new quantity
    setEditingQuantity(null);
    setTempQuantity('');
    
    const item = tote.items.find(i => i.id === itemId);
    if (!item) return;
    
    const currentCount = scannedCounts[itemId] || 0;
    const targetQuantity = Math.max(0, Math.min(item.quantity, parseInt(newQuantity) || 0));
    const difference = targetQuantity - currentCount;
    
    if (difference > 0) {
      // Add items
      const itemsToAdd = new Array(difference).fill(itemId);
      setScannedItems(prev => [...prev, ...itemsToAdd]);
      setScannedItemId(itemId);
      playSound('success');
    } else if (difference < 0) {
      // Remove items
      const itemsToRemove = Math.abs(difference);
      const newScannedItems = [...scannedItems];
      
      for (let i = 0; i < itemsToRemove; i++) {
        const lastIndex = newScannedItems.lastIndexOf(itemId);
        if (lastIndex !== -1) {
          newScannedItems.splice(lastIndex, 1);
        }
      }
      
      setScannedItems(newScannedItems);
      setRemovedItemId(itemId);
      playSound('error');
    }
  }, [tote.items, scannedCounts, scannedItems]);

  // Handle temp quantity change
  const handleTempQuantityChange = useCallback((value) => {
    setTempQuantity(value);
  }, []);

  // Provide ref access for editing state
  const handleOnEditingRef = useCallback(() => isEditingRef, []);
  
  // Complete packing when all items are scanned
  useEffect(() => {
    if (allItemsPacked && !completeSoundPlayedRef.current && scannedItems.length > 0) {
      completeSoundPlayedRef.current = true;
      setTimeout(() => {
        playSound('levelup');
        setTimeout(() => {
          const stats = {
            time: timerSeconds,
            scannedItems: scannedItems,
            accuracy: 100,
            totalItems: tote.totalItems
          };
          isCompletingRef.current = true;
          onComplete(stats);
        }, 1000);
      }, 500);
    }
  }, [allItemsPacked, onComplete, scannedItems, timerSeconds, tote.totalItems]);
  
  // Helper functions
  const getScannedCount = useCallback((itemId) => {
    return scannedCounts[itemId] || 0;
  }, [scannedCounts]);
  
  const isItemFullyScanned = useCallback((itemId) => {
    const item = tote.items.find(i => i.id === itemId);
    if (!item) return false;
    return getScannedCount(itemId) >= item.quantity;
  }, [tote.items, getScannedCount]);
  
  const isItemPartiallyScanned = useCallback((itemId) => {
    const count = getScannedCount(itemId);
    return count > 0 && !isItemFullyScanned(itemId);
  }, [getScannedCount, isItemFullyScanned]);
  
  // Input handlers
  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    playSound('click');
  }, []);
  
  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
    setJustClicked(false);
  }, []);
  
  const handleInputClick = useCallback(() => {
    setJustClicked(true);
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      initializeAudio();
    }
  }, []);
  
  // Section content renderer
  const renderSectionContent = useCallback((sectionId) => {
    switch (sectionId) {
      case 'itemsToPack':
        return (
          <div className="flex items-center space-x-3">
            <GripVertical className="text-blue-400/60" size={20} />
            <Box className="text-blue-400" size={24} />
            <h3 className="text-4xl font-bold text-white">Items to Pack</h3>
            <div className="bg-blue-500/20 border border-blue-500/50 px-3 py-1 rounded-full">
              <motion.span 
                key={unpackedItems.length}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-blue-300 font-bold"
              >
                {unpackedItems.length} items
              </motion.span>
            </div>
          </div>
        );
      
      case 'packedItems':
        return packedItems.length > 0 ? (
          <div className="flex items-center space-x-3">
            <GripVertical className="text-green-400/60" size={20} />
            <CheckCircle className="text-green-400" size={24} />
            <h3 className="text-4xl font-bold text-white">Packed Items</h3>
            <div className="bg-green-500/20 border border-green-500/50 px-3 py-1 rounded-full">
              <motion.span 
                key={packedItems.length}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-green-300 font-bold"
              >
                {packedItems.length} packed
              </motion.span>
            </div>
          </div>
        ) : null;
      
      case 'metrics':
        return (
          <div className="flex items-center space-x-3">
            <GripVertical className="text-purple-400/60" size={20} />
            <BarChart3 className="text-purple-400" size={24} />
            <h3 className="text-4xl font-bold text-white">Metrics & Stats</h3>
            <div className="bg-purple-500/20 border border-purple-500/50 px-3 py-1 rounded-full">
              <span className="text-purple-300 font-bold">Live Stats</span>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  }, [unpackedItems.length, packedItems.length]);
  
  // Get section config
  const getSectionConfig = useCallback((sectionId) => {
    switch (sectionId) {
      case 'itemsToPack':
        return {
          id: 'itemsToPack',
          show: showItemsToPack,
          setShow: setShowItemsToPack,
          bgColor: 'bg-gray-900/30 backdrop-blur-md hover:shadow-2xl hover:shadow-blue-500/20 border-gray-700/55 hover:border-blue-500/50',
          chevronColor: 'text-blue-400',
          visible: true,
          content: (
            <div className="flex flex-col h-full">
              {/* Barcode Scanner */}
              {showItemsToPack && (
                <div className="mb-6">
                  <motion.form 
                    onSubmit={handleScanSubmit}
                    className="relative"
                  >
                    <div className="relative bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-1 rounded-xl">
                      <div className="relative bg-gray-900 rounded-lg">
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
                                : scanRemoved
                                ? 'text-red-400' 
                                : scanError
                                ? 'text-red-400' 
                                : 'text-blue-400'
                            }`} size={40} />
                          </motion.div>
                        </div>
                        
                        {!inputValue && !scanSuccess && !scanError && !scanRemoved && (
                          <AnimatePresence>
                            <AnimatedPlaceholder 
                              inputValue={inputValue} 
                              isTyping={isTyping} 
                              isFocused={isFocused} 
                              justClicked={justClicked}
                            />
                          </AnimatePresence>
                        )}
                        
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onFocus={handleInputFocus}
                          onBlur={handleInputBlur}
                          onClick={handleInputClick}
                          onMouseDown={() => setIsInteractingWithItem(true)}
                          placeholder=""
                          autoComplete="off"
                          autoFocus
                          className={`w-full pl-20 pr-16 h-24 text-left bg-gray-800 border-2 ${
                            scanSuccess 
                              ? 'border-green-500 ring-4 ring-green-500/30 bg-green-900/60' 
                              : scanRemoved
                              ? 'border-red-500 ring-4 ring-red-500/30 bg-red-900/60'
                              : scanError
                              ? 'border-red-500 ring-4 ring-red-500/30 bg-red-900/60' 
                              : 'border-blue-500 focus:ring-4 focus:ring-blue-500/40 focus:border-blue-500 hover:border-blue-400 hover:bg-gray-800/90'
                          } rounded-xl text-white outline-none transition-all duration-200 text-3xl font-mono shadow-lg caret-blue-500`}
                          style={{ lineHeight: '1.5' }}
                        />
                        
                        {/* Status messages */}
                        {(scanSuccess || scanError || scanRemoved) && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`absolute inset-x-0 top-full mt-2 text-center text-lg font-bold ${
                              scanSuccess ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {scanSuccess && 'Item Scanned! ✓'}
                            {scanRemoved && 'Item Removed'}
                            {scanError}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.form>
                </div>
              )}
              
              {/* Items Grid */}
              <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-3 gap-4">
                  {unpackedItems.map((item, index) => (
                    <OptimizedPackingItem
                      key={item.id}
                      item={item}
                      scannedCount={getScannedCount(item.id)}
                      isSelected={selectedItemId === item.id}
                      isFullyScanned={isItemFullyScanned(item.id)}
                      isPartiallyScanned={isItemPartiallyScanned(item.id)}
                      isNextToScan={selectedItemId === item.id && !isItemFullyScanned(item.id)}
                      hasAnimated={true}
                      index={index}
                      removedItemId={removedItemId}
                      scannedItemId={scannedItemId}
                      editingQuantity={editingQuantity}
                      tempQuantity={tempQuantity}
                      isDragging={!!draggingSection}
                      onItemClick={handleItemClick}
                      isMinimized={false}
                      isCompact={false}
                      sectionId={sectionId}
                      onAddItem={handleAddItem}
                      onRemoveItem={handleRemoveItem}
                      onEditQuantity={handleEditQuantity}
                      onTempQuantityChange={handleTempQuantityChange}
                      onEditingRef={handleOnEditingRef}
                      onMouseDown={() => setIsInteractingWithItem(false)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        };
      
      case 'packedItems':
        return {
          id: 'packedItems',
          show: showPackedItems,
          setShow: setShowPackedItems,
          bgColor: 'bg-gray-900/30 backdrop-blur-md hover:shadow-2xl hover:shadow-green-500/20 border-gray-700/55 hover:border-green-500/50',
          chevronColor: 'text-green-400',
          visible: packedItems.length > 0,
          content: (
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-2 gap-4">
                {packedItems.map((item, index) => (
                  <OptimizedPackingItem
                    key={item.id}
                    item={item}
                    scannedCount={getScannedCount(item.id)}
                    isSelected={false}
                    isFullyScanned={true}
                    isPartiallyScanned={false}
                    isNextToScan={false}
                    hasAnimated={true}
                    index={index}
                    removedItemId={removedItemId}
                    scannedItemId={scannedItemId}
                    editingQuantity={editingQuantity}
                    tempQuantity={tempQuantity}
                    isDragging={!!draggingSection}
                    onItemClick={handleItemClick}
                    isMinimized={!showPackedItems}
                    isCompact={true}
                    sectionId={sectionId}
                    onAddItem={handleAddItem}
                    onRemoveItem={handleRemoveItem}
                    onEditQuantity={handleEditQuantity}
                    onTempQuantityChange={handleTempQuantityChange}
                    onEditingRef={() => {}}
                    onMouseDown={() => setIsInteractingWithItem(false)}
                  />
                ))}
              </div>
            </div>
          )
        };
      
      case 'metrics':
        return {
          id: 'metrics',
          show: showMetrics,
          setShow: setShowMetrics,
          bgColor: 'bg-gray-900/30 backdrop-blur-md hover:shadow-2xl hover:shadow-purple-500/20 border-gray-700/55 hover:border-purple-500/50',
          chevronColor: 'text-purple-400',
          visible: true,
          content: showMetrics ? (
            (() => {
              const zone = getCurrentZone('metrics');
              const isInBottomZone = zone === 'bottom-left' || zone === 'bottom-right';
              
              // Check if metrics is next to items to pack
              const isMetricsNextToItems = isInBottomZone && 
                ((zone === 'bottom-left' && dropzoneContents['bottom-right'] === 'itemsToPack') ||
                 (zone === 'bottom-right' && dropzoneContents['bottom-left'] === 'itemsToPack'));
              
              // Dynamic min-height based on whether it's next to items to pack
              const minHeight = isMetricsNextToItems ? '800px' : '550px';
              
              return (
                <div className={`flex flex-col h-full overflow-auto p-4`} style={{ minHeight }}>
              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 flex-shrink-0 mb-6">
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-6 text-center border border-white/10">
                  <div className="flex justify-center mb-3">
                    {renderMixedGameIcons(tote.items, totalScanned, 96)}
                  </div>
                  <p className="text-4xl font-bold">{totalScanned}</p>
                  <p className="text-2xl text-gray-400">Items Scanned</p>
                </div>
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-6 text-center border border-white/10">
                  <div className="flex justify-center mb-3">
                    <GameIcon 
                      iconType="star" 
                      iconCount={totalItems} 
                      size={96} 
                      iconSize="large" 
                      showBadge={false}
                    />
                  </div>
                  <p className="text-4xl font-bold">{totalItems}</p>
                  <p className="text-2xl text-gray-400">Total Items</p>
                </div>
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-6 text-center border border-white/10">
                  <div className="flex justify-center mb-3">
                    <GameIcon 
                      iconType="check" 
                      iconCount={packedItems.length} 
                      size={96} 
                      iconSize="large" 
                      showBadge={false}
                    />
                  </div>
                  <p className="text-4xl font-bold">{packedItems.length}</p>
                  <p className="text-2xl text-gray-400">SKUs Complete</p>
                </div>
              </div>
              
              {/* Order Info */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4 shadow-lg shadow-blue-500/20 mb-4">
                <h3 className="text-2xl font-semibold text-blue-300 mb-3">Order Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order ID:</span>
                    <span className="text-white font-bold">{tote.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer:</span>
                    <span className="text-white">{tote.customer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Priority:</span>
                    <PriorityBadge priority={tote.priority} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Progress:</span>
                    <span className="text-white font-bold">{Math.round(orderProgress)}%</span>
                  </div>
                </div>
              </div>
              
              {/* GameIcon Tier Guide */}
              <div className={`flex-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 shadow-lg shadow-purple-500/20 flex flex-col ${isInBottomZone ? 'min-h-[400px]' : 'min-h-0'}`}>
                <div className="flex items-center justify-center mb-3">
                  <Sparkles className="text-purple-400 mr-2" size={16} />
                  <h3 className="text-2xl font-semibold text-purple-300">Item Tier Colors</h3>
                </div>
                
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 content-center items-center min-h-0">
                  <div className="flex items-center space-x-3">
                    {renderMixedGameIcons(tote.items, 1, 144, true)}
                    <span className="text-white text-base">1 item</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {renderMixedGameIcons(tote.items, 5, 144, true)}
                    <span className="text-blue-400 text-base">5 items</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {renderMixedGameIcons(tote.items, 10, 144, true)}
                    <span className="text-orange-400 text-base">10 items</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {renderMixedGameIcons(tote.items, 25, 144, true)}
                    <span className="text-purple-400 text-base">25+ items</span>
                  </div>
                </div>
              </div>
            </div>
              );
            })()
          ) : (
            <div className="p-4">
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 shadow-lg shadow-purple-500/20">
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{totalScanned}/{totalItems}</p>
                    <p className="text-base text-gray-400">Items Scanned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{Math.round(orderProgress)}%</p>
                    <p className="text-base text-gray-400">Complete</p>
                  </div>
                </div>
              </div>
            </div>
          )
        };
      
      default:
        return null;
    }
  }, [showItemsToPack, showPackedItems, showMetrics, unpackedItems, packedItems, 
      getScannedCount, isItemFullyScanned, isItemPartiallyScanned, selectedItemId,
      removedItemId, scannedItemId, editingQuantity, tempQuantity, draggingSection,
      handleItemClick, handleRemoveItem, totalScanned, totalItems, orderProgress,
      tote, handleScanSubmit, inputValue, scanSuccess, scanError, scanRemoved,
      isTyping, isFocused, justClicked, handleInputFocus, handleInputBlur, 
      handleInputClick]);
  
  // Check if all sections are minimized
  const allSectionsMinimized = !showItemsToPack && !showPackedItems && !showMetrics;
  
  return (
    <div className="min-h-screen w-full p-4 bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      {/* Back Button */}
      {onBack && <BackButton onClick={onBack} />}
      
      {/* Header */}
      <div className="glass-card p-4 mb-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <Package className="text-blue-400" size={32} />
              <div>
                <h2 className="text-2xl font-bold">Order #{tote.orderId}</h2>
                <p className="text-gray-400">{tote.customer}</p>
              </div>
            </div>
            <PriorityBadge priority={tote.priority} />
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className="px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <div className="flex items-center space-x-2">
                <Clock className="text-blue-400" size={20} />
                <span className="text-white font-mono text-lg">
                  {formatTime(timerSeconds)}
                </span>
              </div>
            </div>
            
            {/* Progress Ring */}
            <ProgressRing 
              progress={orderProgress / 100} 
              size={60}
              strokeWidth={4}
              strokeColor="#3b82f6"
            />
            
            {/* Combo Counter */}
            {combo > 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30"
              >
                <Zap className="text-yellow-400" size={20} />
                <span className="text-yellow-400 font-bold">{combo}x</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {/* Dropzones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
        {/* Top Dropzone */}
        <motion.div 
          className="lg:col-span-2"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div 
            data-dropzone="top"
            className={`border-2 ${allSectionsMinimized ? 'border-solid' : 'border-dashed'} rounded-2xl p-4 backdrop-blur-sm relative transition-all duration-300 flex flex-col ${
              dragOverZone === 'top' 
                ? 'border-blue-400 bg-blue-500/20 shadow-2xl shadow-blue-500/30 animate-pulse' 
                : draggingSection && dropzoneContents['top'] !== draggingSection
                ? 'border-blue-300 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                : scanSuccess
                ? 'border-green-500 bg-white/5'
                : scanError
                ? 'border-red-500 bg-red-500/10'
                : scanRemoved
                ? 'border-red-500 bg-white/5'
                : 'border-blue-500 bg-white/5'
            }`}
            style={{
              transition: resizingZone === 'top' ? 'none' : 'all 0.3s ease'
            }}
          >
            {dropzoneContents['top'] && (() => {
              const sectionId = dropzoneContents['top'];
              const config = getSectionConfig(sectionId);
              if (!config || !config.visible) return null;

              return (
                <motion.div
                  key={sectionId}
                  drag={!isInteractingWithItem}
                  dragSnapToOrigin
                  dragMomentum={false}
                  dragConstraints={{
                    left: -window.innerWidth * 0.4,
                    right: window.innerWidth * 0.4,
                    top: -window.innerHeight * 0.4,
                    bottom: window.innerHeight * 0.4
                  }}
                  dragElastic={0.1}
                  className={`relative ${draggingSection === sectionId ? 'z-50' : 'z-10'}`}
                  layoutId={sectionId}
                  whileDrag={{
                    scale: 1.05,
                    opacity: 0.9,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                  }}
                  ref={(el) => {
                    if (el) dragElementRefs.current[sectionId] = el;
                  }}
                  onDragStart={() => {
                    if (!isInteractingWithItem) {
                      setDraggingSection(sectionId);
                      playSound('click');
                    }
                  }}
                  onDrag={(event) => {
                    if (!isInteractingWithItem) {
                      const pointerX = event.clientX || 0;
                      const pointerY = event.clientY || 0;
                      
                      const dropzones = document.querySelectorAll('[data-dropzone]');
                      let targetZone = null;
                      
                      dropzones.forEach(zone => {
                        const zoneRect = zone.getBoundingClientRect();
                        if (pointerX >= zoneRect.left && pointerX <= zoneRect.right &&
                            pointerY >= zoneRect.top && pointerY <= zoneRect.bottom) {
                          const zoneId = zone.getAttribute('data-dropzone');
                          if (dropzoneContents[zoneId] !== sectionId) {
                            targetZone = zoneId;
                          }
                        }
                      });
                      
                      setDragOverZone(targetZone);
                      
                      if (targetZone) {
                        const transform = getDropzoneTransform(targetZone, getCurrentZone(sectionId));
                        setDragTransform(transform);
                      } else {
                        setDragTransform({ scale: 1.05, x: 0, y: 0 });
                      }
                    }
                  }}
                  onDragEnd={(event, info) => handleDragEndWithZoneDetection(event, info, sectionId)}
                >
                  <motion.div 
                    className={`h-full w-full flex flex-col transition-all duration-300 ${config.bgColor} border rounded-xl overflow-hidden group`}
                    whileHover={{
                      borderColor: sectionId === 'itemsToPack' ? '#60a5fa' : 
                                 sectionId === 'metrics' ? '#fb923c' : '#34d399',
                      scale: 1.005
                    }}
                  >
                    <motion.button
                      onClick={() => {
                        if (!draggingSection) {
                          config.setShow(!config.show);
                          playSound('click');
                        }
                      }}
                      className={`flex items-center justify-between w-full p-3 transition-all duration-300 cursor-move relative overflow-hidden border border-white/20 rounded-t-xl -m-px`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {renderSectionContent(sectionId)}
                      <div className="flex items-center space-x-2">
                        {/* Refresh button */}
                        <motion.button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefreshSection(sectionId);
                          }}
                          className={`p-1.5 rounded-lg ${config.bgColor} hover:bg-white/10 transition-all duration-200`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Refresh section"
                        >
                          <RefreshCw className={config.chevronColor} size={18} />
                        </motion.button>
                        
                        <span className={`${config.chevronColor} text-sm font-medium opacity-80`}>
                          {config.show ? 'Hide' : 'Show'}
                        </span>
                        <motion.div
                          animate={{ rotate: config.show ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {config.show ? (
                            <ChevronUp className={config.chevronColor} size={20} />
                          ) : (
                            <ChevronDown className={config.chevronColor} size={20} />
                          )}
                        </motion.div>
                      </div>
                    </motion.button>
                    
                    <AnimatePresence mode="wait">
                      {config.show && config.content && (
                        <motion.div 
                          className="flex-1 overflow-hidden flex flex-col relative"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {config.content}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            })()}
          </div>
        </motion.div>
        
        {/* Bottom Left Dropzone */}
        {dropzoneContents['bottom-left'] && (dropzoneContents['bottom-left'] !== 'packedItems' || packedItems.length > 0) && (
          <motion.div 
            className={`${!allSectionsMinimized && (!dropzoneContents['bottom-right'] || (dropzoneContents['bottom-right'] === 'packedItems' && packedItems.length === 0)) ? 'lg:col-span-2' : ''}`}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div 
              data-dropzone="bottom-left"
              className={`border-2 ${allSectionsMinimized ? 'border-solid' : 'border-dashed'} rounded-2xl p-4 backdrop-blur-sm relative transition-all duration-300 flex flex-col ${
                dragOverZone === 'bottom-left' 
                  ? 'border-green-400 bg-green-500/20 shadow-2xl shadow-green-500/30 animate-pulse' 
                  : draggingSection && dropzoneContents['bottom-left'] !== draggingSection
                  ? 'border-green-300 bg-green-500/5 shadow-lg shadow-green-500/10'
                  : 'border-blue-500 bg-white/5'
              }`}
              style={{
                transition: resizingZone === 'bottom-left' ? 'none' : 'all 0.3s ease'
              }}
            >
              {/* Render section content similar to top dropzone */}
              {dropzoneContents['bottom-left'] && (() => {
                const sectionId = dropzoneContents['bottom-left'];
                const config = getSectionConfig(sectionId);
                if (!config || !config.visible) return null;

                return (
                  <motion.div
                    key={sectionId}
                    drag={!isInteractingWithItem}
                    dragSnapToOrigin
                    dragMomentum={false}
                    dragConstraints={{
                      left: -window.innerWidth * 0.8,
                      right: window.innerWidth * 0.8,
                      top: -window.innerHeight * 0.8,
                      bottom: window.innerHeight * 0.8
                    }}
                    dragElastic={0.2}
                    className={`relative ${draggingSection === sectionId ? 'z-50' : 'z-10'}`}
                    whileDrag={{
                      scale: 1.05,
                      opacity: 0.9,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    }}
                    ref={(el) => {
                      if (el) dragElementRefs.current[sectionId] = el;
                    }}
                    onDragStart={() => {
                      if (!isInteractingWithItem) {
                        setDraggingSection(sectionId);
                        playSound('click');
                      }
                    }}
                    onDrag={(event) => {
                      if (!isInteractingWithItem) {
                        const pointerX = event.clientX || 0;
                        const pointerY = event.clientY || 0;
                        
                        const dropzones = document.querySelectorAll('[data-dropzone]');
                        let targetZone = null;
                        
                        dropzones.forEach(zone => {
                          const zoneRect = zone.getBoundingClientRect();
                          if (pointerX >= zoneRect.left && pointerX <= zoneRect.right &&
                              pointerY >= zoneRect.top && pointerY <= zoneRect.bottom) {
                            const zoneId = zone.getAttribute('data-dropzone');
                            if (dropzoneContents[zoneId] !== sectionId) {
                              targetZone = zoneId;
                            }
                          }
                        });
                        
                        setDragOverZone(targetZone);
                        
                        if (targetZone) {
                          const transform = getDropzoneTransform(targetZone, getCurrentZone(sectionId));
                          setDragTransform(transform);
                        } else {
                          setDragTransform({ scale: 1.05, x: 0, y: 0 });
                        }
                      }
                    }}
                    onDragEnd={(event, info) => handleDragEndWithZoneDetection(event, info, sectionId)}
                  >
                    <div className={`h-full w-full flex flex-col transition-all duration-300 ${config.bgColor} border rounded-xl overflow-hidden group`}>
                      <motion.button
                        onClick={() => {
                          if (!draggingSection) {
                            config.setShow(!config.show);
                            playSound('click');
                          }
                        }}
                        className={`flex items-center justify-between w-full p-3 transition-all duration-300 ${!isInteractingWithItem ? 'cursor-move' : 'cursor-pointer'} relative overflow-hidden`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        {renderSectionContent(sectionId)}
                        <div className="flex items-center space-x-2">
                          {/* Refresh button */}
                          <motion.button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRefreshSection(sectionId);
                            }}
                            className={`p-1.5 rounded-lg ${config.bgColor} hover:bg-white/10 transition-all duration-200`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Refresh section"
                          >
                            <RefreshCw className={config.chevronColor} size={18} />
                          </motion.button>
                          
                          <span className={`${config.chevronColor} text-sm font-medium opacity-80`}>
                            {config.show ? 'Hide' : 'Show'}
                          </span>
                          <motion.div
                            animate={{ rotate: config.show ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {config.show ? (
                              <ChevronUp className={config.chevronColor} size={20} />
                            ) : (
                              <ChevronDown className={config.chevronColor} size={20} />
                            )}
                          </motion.div>
                        </div>
                      </motion.button>
                      
                      <AnimatePresence mode="wait">
                        {config.show && config.content && (
                          <motion.div 
                            className={`flex-1 ${config.bgColor} border-l border-r border-b rounded-xl overflow-hidden flex flex-col relative`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {config.content}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          </motion.div>
        )}
        
        {/* Bottom Right Dropzone */}
        {!(dropzoneContents['bottom-right'] === 'packedItems' && packedItems.length === 0) && (
          <motion.div 
            className={`${!allSectionsMinimized && (!dropzoneContents['bottom-left'] || (dropzoneContents['bottom-left'] === 'packedItems' && packedItems.length === 0)) ? 'lg:col-span-2' : ''}`}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div 
              data-dropzone="bottom-right"
              className={`border-2 ${allSectionsMinimized ? 'border-solid' : 'border-dashed'} rounded-2xl p-4 backdrop-blur-sm relative transition-all duration-300 flex flex-col ${
                dragOverZone === 'bottom-right' 
                  ? 'border-purple-400 bg-purple-500/20 shadow-2xl shadow-purple-500/30 animate-pulse' 
                  : draggingSection && dropzoneContents['bottom-right'] !== draggingSection
                  ? 'border-purple-300 bg-purple-500/5 shadow-lg shadow-purple-500/10'
                  : 'border-blue-500 bg-white/5'
              }`}
              style={{
                transition: resizingZone === 'bottom-right' ? 'none' : 'all 0.3s ease'
              }}
            >
              {/* Render section content similar to other dropzones */}
              {dropzoneContents['bottom-right'] && (() => {
                const sectionId = dropzoneContents['bottom-right'];
                const config = getSectionConfig(sectionId);
                if (!config || !config.visible) return null;

                return (
                  <motion.div
                    key={sectionId}
                    drag={!isInteractingWithItem}
                    dragSnapToOrigin
                    dragMomentum={false}
                    dragConstraints={{
                      left: -window.innerWidth * 0.8,
                      right: window.innerWidth * 0.8,
                      top: -window.innerHeight * 0.8,
                      bottom: window.innerHeight * 0.8
                    }}
                    dragElastic={0.2}
                    className={`relative ${draggingSection === sectionId ? 'z-50' : 'z-10'}`}
                    whileDrag={{
                      scale: 1.05,
                      opacity: 0.9,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    }}
                    ref={(el) => {
                      if (el) dragElementRefs.current[sectionId] = el;
                    }}
                    onDragStart={() => {
                      if (!isInteractingWithItem) {
                        setDraggingSection(sectionId);
                        playSound('click');
                      }
                    }}
                    onDrag={(event) => {
                      if (!isInteractingWithItem) {
                        const pointerX = event.clientX || 0;
                        const pointerY = event.clientY || 0;
                        
                        const dropzones = document.querySelectorAll('[data-dropzone]');
                        let targetZone = null;
                        
                        dropzones.forEach(zone => {
                          const zoneRect = zone.getBoundingClientRect();
                          if (pointerX >= zoneRect.left && pointerX <= zoneRect.right &&
                              pointerY >= zoneRect.top && pointerY <= zoneRect.bottom) {
                            const zoneId = zone.getAttribute('data-dropzone');
                            if (dropzoneContents[zoneId] !== sectionId) {
                              targetZone = zoneId;
                            }
                          }
                        });
                        
                        setDragOverZone(targetZone);
                        
                        if (targetZone) {
                          const transform = getDropzoneTransform(targetZone, getCurrentZone(sectionId));
                          setDragTransform(transform);
                        } else {
                          setDragTransform({ scale: 1.05, x: 0, y: 0 });
                        }
                      }
                    }}
                    onDragEnd={(event, info) => handleDragEndWithZoneDetection(event, info, sectionId)}
                  >
                    <div className={`h-full w-full flex flex-col transition-all duration-300 ${config.bgColor} border rounded-xl overflow-hidden group`}>
                      <motion.button
                        onClick={() => {
                          if (!draggingSection) {
                            config.setShow(!config.show);
                            playSound('click');
                          }
                        }}
                        className={`flex items-center justify-between w-full p-3 transition-all duration-300 ${!isInteractingWithItem ? 'cursor-move' : 'cursor-pointer'} relative overflow-hidden`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        {renderSectionContent(sectionId)}
                        <div className="flex items-center space-x-2">
                          {/* Refresh button */}
                          <motion.button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRefreshSection(sectionId);
                            }}
                            className={`p-1.5 rounded-lg ${config.bgColor} hover:bg-white/10 transition-all duration-200`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Refresh section"
                          >
                            <RefreshCw className={config.chevronColor} size={18} />
                          </motion.button>
                          
                          <span className={`${config.chevronColor} text-sm font-medium opacity-80`}>
                            {config.show ? 'Hide' : 'Show'}
                          </span>
                          <motion.div
                            animate={{ rotate: config.show ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {config.show ? (
                              <ChevronUp className={config.chevronColor} size={20} />
                            ) : (
                              <ChevronDown className={config.chevronColor} size={20} />
                            )}
                          </motion.div>
                        </div>
                      </motion.button>
                      
                      <AnimatePresence mode="wait">
                        {config.show && config.content && (
                          <motion.div 
                            className={`flex-1 ${config.bgColor} border-l border-r border-b rounded-xl overflow-hidden flex flex-col relative`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {config.content}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Combo Animation */}
      <AnimatePresence>
        {showComboAnimation && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: -50 }}
            className="fixed bottom-10 right-10 z-50"
          >
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3">
              <Zap size={24} />
              <span className="text-2xl font-bold">Combo x{combo}!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default PackingScreen;