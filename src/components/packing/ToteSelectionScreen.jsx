import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Barcode, User, Calendar, Play, ArrowRight, 
  ScanLine, AlertCircle, CheckCircle, Search
} from 'lucide-react';
import PriorityBadge from '../PriorityBadge';
import ScanInput from '../ScanInput';
import BackButton from '../BackButton';
import GameIcon from '../GameIcon';
import { playSound, initializeAudio, isAudioInitialized } from '../../utils/audio';
import { formatDate } from '../../utils/formatters';

// Helper function to determine icon type based on item (copied from Picking.jsx)
const getItemIconType = (item) => {
  if (!item) return 'box';
  
  const itemName = item.name?.toLowerCase() || '';
  const itemSku = item.sku?.toLowerCase() || '';
  
  // Specific Security Equipment
  
  // PIR Motion Sensors
  if (itemName.includes('pir') || itemName.includes('motion') || itemName.includes('sensor') ||
      itemSku.includes('sens') || itemSku.includes('pir')) {
    return 'pir';
  }
  
  // Sirens
  if (itemName.includes('siren') || itemName.includes('alarm') || itemName.includes('outdoor siren') ||
      itemSku.includes('siren')) {
    return 'siren';
  }
  
  // Control Panels
  if (itemName.includes('control panel') || itemName.includes('smart control') || itemName.includes('alarm panel') ||
      itemSku.includes('ctrl') || itemSku.includes('control')) {
    return 'controlPanel';
  }
  
  // Door Contacts
  if (itemName.includes('door contact') || itemName.includes('magnetic') || itemName.includes('door sensor') ||
      itemName.includes('window contact') || itemSku.includes('door')) {
    return 'doorContact';
  }
  
  // Keypads
  if (itemName.includes('keypad') || itemName.includes('lcd keypad') || itemName.includes('proximity reader') ||
      itemSku.includes('key') || itemSku.includes('keypad')) {
    return 'keypad';
  }
  
  // Smoke Detectors
  if (itemName.includes('smoke') || itemName.includes('detector') || itemName.includes('photoelectric') ||
      itemSku.includes('smoke')) {
    return 'smokeDetector';
  }
  
  // Cameras
  if (itemName.includes('camera') || itemName.includes('dome') || itemName.includes('security camera') || 
      itemName.includes('cctv') || itemName.includes('surveillance') || 
      itemSku.includes('cam') || itemSku.includes('dome')) {
    return 'camera';
  }
  
  // Panic Buttons
  if (itemName.includes('panic') || itemName.includes('emergency') || itemName.includes('panic button') ||
      itemSku.includes('panic')) {
    return 'panicButton';
  }
  
  // Network Equipment
  if (itemName.includes('switch') || itemName.includes('network') || itemName.includes('ethernet') || 
      itemName.includes('router') || itemName.includes('hub') || itemName.includes('poe') ||
      itemSku.includes('switch') || itemSku.includes('sw') || itemSku.includes('net')) {
    return 'switch';
  }
  
  // Touch/Interface Equipment
  if (itemName.includes('touch') || itemName.includes('kit') || itemName.includes('interface') || 
      itemName.includes('panel') || itemName.includes('display') ||
      itemSku.includes('ec-kit') || itemSku.includes('touch') || itemSku.includes('kit')) {
    return 'touchKit';
  }
  
  // Physical size-based icons
  if (itemName.includes('pallet') || itemName.includes('skid') || itemName.includes('platform') || 
      item.quantity >= 50) {
    return 'pallet';
  }
  
  if (itemName.includes('large') || itemName.includes('bulk') || itemName.includes('oversized') || 
      itemName.includes('heavy')) {
    return 'largeItem';
  }
  
  if (itemName.includes('satchel') || itemName.includes('bag') || itemName.includes('pouch')) {
    return 'satchel';
  }
  
  if (itemName.includes('carton') || itemName.includes('cardboard')) {
    return 'carton';
  }
  
  if (itemName.includes('box') || itemName.includes('package') || itemName.includes('container')) {
    return 'box';
  }
  
  // Default to box for other items
  return 'box';
};

// Helper function to determine the most representative icon type for a tote
const getToteIconType = (tote) => {
  if (!tote.items || tote.items.length === 0) return 'box';
  
  // Find the icon type that appears most frequently in the tote
  const iconCounts = {};
  
  tote.items.forEach(item => {
    const iconType = getItemIconType(item);
    iconCounts[iconType] = (iconCounts[iconType] || 0) + item.quantity;
  });
  
  // Return the icon type with the highest quantity
  const mostCommonIcon = Object.entries(iconCounts).reduce((a, b) => 
    iconCounts[a[0]] > iconCounts[b[0]] ? a : b
  )[0];
  
  return mostCommonIcon;
};

const ToteSelectionScreen = ({ totes, onSelectTote }) => {
  const [audioStatus, setAudioStatus] = useState('not-initialized');
  const [scanMode, setScanMode] = useState(true);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [highlightedToteId, setHighlightedToteId] = useState(null);
  const scanInputRef = useRef(null);
  
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

  const handleScan = (scannedValue) => {
    setScanError('');
    setScanSuccess(false);
    
    // Find tote by orderId (SO number)
    const matchedTote = totes.find(tote => 
      tote.orderId.toLowerCase() === scannedValue.toLowerCase()
    );
    
    if (matchedTote) {
      setScanSuccess(true);
      setHighlightedToteId(matchedTote.id);
      playSound('success');
      
      // Auto-select after a brief highlight
      setTimeout(() => {
        onSelectTote(matchedTote);
        playSound('complete');
      }, 500);
    } else {
      setScanError(`Order ${scannedValue} not found in available totes`);
      playSound('error');
      
      // Clear error after 3 seconds
      setTimeout(() => setScanError(''), 3000);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': 
        return 'from-red-500/20 to-red-600/10';
      case 'overnight': 
        return 'from-orange-500/20 to-orange-600/10';
      default: 
        return 'from-blue-500/20 to-blue-600/10';
    }
  };

  const sortedTotes = [...totes].sort((a, b) => {
    const priorityOrder = { urgent: 0, overnight: 1, normal: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Audio status indicator */}
      {audioStatus !== 'initialized' && (
        <div className="fixed top-4 right-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 text-yellow-300 text-sm z-50">
          🔇 Click anywhere to enable sound effects
        </div>
      )}
      
      <BackButton />
      
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <ShoppingCart className="text-blue-400 mr-3" size={48} />
          <h1 className="text-6xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Select an Order
          </h1>
        </div>
        <p className="text-xl text-gray-400 flex items-center justify-center">
          <ShoppingCart className="mr-2" size={20} />
          Select an order number to begin packing
        </p>
      </div>

      {/* Scanning Section */}
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {scanMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <ScanLine className="text-blue-400 mr-3" size={24} />
                  <h3 className="text-lg font-semibold text-white">Scan Order Number</h3>
                </div>
                <button
                  onClick={() => setScanMode(false)}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Hide Scanner
                </button>
              </div>
              
              <ScanInput
                ref={scanInputRef}
                onScan={handleScan}
                placeholder="Scan SO barcode..."
                autoFocus={true}
                pattern="SO\d+"
              />
              
              {/* Scan feedback messages */}
              <AnimatePresence>
                {scanError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 flex items-center text-red-400"
                  >
                    <AlertCircle size={16} className="mr-2" />
                    <span className="text-sm">{scanError}</span>
                  </motion.div>
                )}
                
                {scanSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 flex items-center text-green-400"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    <span className="text-sm">Order found! Loading...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!scanMode && (
          <div className="text-center">
            <button
              onClick={() => {
                setScanMode(true);
                setTimeout(() => scanInputRef.current?.focus(), 100);
              }}
              className="inline-flex items-center px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-xl text-blue-400 font-medium transition-all duration-300"
            >
              <ScanLine size={20} className="mr-2" />
              Show Scanner
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center">
          <div className="flex-1 h-px bg-gray-800"></div>
          <span className="px-4 text-gray-500 text-sm">or select manually</span>
          <div className="flex-1 h-px bg-gray-800"></div>
        </div>
      </div>
      
      {/* Tote Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-[2400px] mx-auto">
        {sortedTotes.map((tote, index) => (
          <motion.div
            key={tote.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: highlightedToteId === tote.id ? 1.05 : 1,
              transition: { delay: index * 0.05 }
            }}
            whileHover={{ scale: 1.02, y: -4, transition: { type: "spring", stiffness: 600, damping: 20 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onSelectTote(tote);
              playSound('complete');
            }}
            onMouseEnter={() => playSound('hover')}
            className="group cursor-pointer"
          >
            <div className={`bg-gray-900/50 backdrop-blur-xl rounded-3xl p-6 h-full hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:border-blue-500/50 border relative overflow-hidden ${
              highlightedToteId === tote.id 
                ? 'border-green-500 shadow-2xl shadow-green-500/30' 
                : 'border-gray-800'
            }`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${getPriorityColor(tote.priority)} opacity-50`} />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/5 group-hover:to-blue-500/10 rounded-3xl transition-all duration-500" />
              
              {/* Highlight effect for scanned tote */}
              {highlightedToteId === tote.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-green-500/20 rounded-3xl"
                />
              )}
              
              <div className="relative">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors flex items-center justify-center">
                    <Barcode className="mr-2" size={24} />
                    {tote.orderId}
                  </h2>
                  <p className="text-sm text-gray-600 flex items-center justify-center">
                    <User className="mr-1" size={14} />
                    {tote.customer}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 flex items-center justify-center whitespace-nowrap">
                    <Calendar className="mr-1 flex-shrink-0" size={12} />
                    <span>Picked: {formatDate(tote.pickedDate)}</span>
                  </p>
                </div>
                
                <div className="space-y-2 mb-4">
                  {tote.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-gray-800/50 last:border-0 group-hover:border-gray-700/50 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-300 group-hover:text-gray-200 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-600 group-hover:text-gray-500 transition-colors flex items-center">
                          <Barcode className="mr-1" size={12} />
                          {item.id}
                        </p>
                      </div>
                      <span className="font-bold text-gray-400 ml-2 group-hover:text-gray-300 transition-colors">
                        ×{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mb-4">
                  <PriorityBadge priority={tote.priority} />
                </div>
                
                <div className="flex justify-center mb-4">
                  <GameIcon
                    iconType={getToteIconType(tote)}
                    actualQuantity={tote.items.reduce((sum, item) => sum + item.quantity, 0)}
                    size={40}
                    iconSize="medium"
                    showBadge={true}
                  />
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <Play className="animate-pulse" size={16} />
                    <span className="font-semibold text-sm">Start Packing Run</span>
                    <ArrowRight className="transform group-hover:translate-x-2 transition-transform" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ToteSelectionScreen;