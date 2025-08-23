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
  Minus,
  Plus,
  Edit2,
  Clock,
  Check,
  AlertTriangle
} from 'lucide-react';

import ScanInput from '../ScanInput';
import PackingTimer from '../PackingTimer';
import PriorityBadge from '../PriorityBadge';
import ProgressRing from '../ProgressRing.jsx';
import BackButton from '../BackButton';
import { playSound, initializeAudio, isAudioInitialized } from '../../utils/audio';
import { formatDate } from '../../utils/formatters';

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

  const totalProgress = scannedItems.length / tote.items.reduce((sum, item) => sum + item.quantity, 0);
  const allItemsScanned = tote.items.every(item => {
    const scannedCount = scannedItems.filter(id => id === item.id).length;
    return scannedCount >= item.quantity;
  });

  const getScannedCount = (itemId) => {
    return scannedItems.filter(id => id === itemId).length;
  };

  const isItemFullyScanned = (itemId) => {
    const item = tote.items.find(i => i.id === itemId);
    const scannedCount = scannedItems.filter(id => id === itemId).length;
    return scannedCount >= item.quantity;
  };

  const isItemPartiallyScanned = (itemId) => {
    const scannedCount = scannedItems.filter(id => id === itemId).length;
    return scannedCount > 0 && !isItemFullyScanned(itemId);
  };

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
      
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 border border-white/10 relative">
        {/* Priority badge on top of card */}
        {tote.priority && (
          <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: '-20px' }}>
            <PriorityBadge priority={tote.priority} size="lg" />
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <Package className="mr-2 text-blue-400" size={28} />
                Items to Pack
              </h2>
              <span className="text-2xl text-gray-400 flex items-center">
                <Barcode className="mr-1" size={28} />
                Order: <span className="font-bold text-white ml-1">{tote.orderId}</span>
              </span>
              <span className="text-2xl text-gray-400 flex items-center">
                <CalendarDays className="mr-1" size={28} />
                Picked: <span className="font-bold text-white ml-1">{formatDate(tote.pickedDate)}</span>
              </span>
            </div>
            
            {/* Timer only */}
            <div className="flex items-center space-x-3 bg-white/[0.05] rounded-xl px-4 py-3">
              <Clock className="text-blue-400" size={24} />
              <div>
                <PackingTimer 
                  isActive={timerActive} 
                  totalProgress={totalProgress}
                  compact={true}
                />
              </div>
            </div>
          </div>
          
          {/* Packing progress - LARGER matching picking page */}
          <div className="relative w-48 h-10 bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className="absolute inset-0 h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white z-10">
                {scannedItems.length}/{tote.items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
            <ScanLine className="mr-3 text-blue-400" size={24} />
            Scan or Click Items
          </h3>
            
          {/* Enhanced Scan Input with animations */}
          <motion.form className="relative">
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
                    <ScanLine className="text-blue-400 transition-all duration-200 drop-shadow-lg" size={40} />
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
                  className="w-full pl-20 pr-16 h-24 text-left bg-gray-800 border-2 border-blue-500 focus:ring-4 focus:ring-blue-500/40 focus:border-blue-500 hover:border-blue-400 hover:bg-gray-800/90 rounded-xl text-white outline-none transition-all duration-200 text-3xl font-mono shadow-lg caret-blue-500"
                  style={{ lineHeight: '1.5' }}
                />
                
                <motion.div
                  className="absolute right-6 top-1/2 -translate-y-1/2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </motion.div>
              </div>
            </div>
          </motion.form>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            Tip: You can scan barcodes or click items below to mark them as packed
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tote.items.map((item, index) => {
            const scannedCount = getScannedCount(item.id);
            const isFullyScanned = isItemFullyScanned(item.id);
            const isPartiallyScanned = isItemPartiallyScanned(item.id);
            
            return (
              <motion.div
                key={item.id}
                className={`relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                  isFullyScanned
                    ? 'bg-green-900/20 border-green-500/50 hover:border-green-400/50'
                    : isPartiallyScanned
                    ? 'bg-yellow-900/20 border-yellow-500/50 hover:border-yellow-400/50'
                    : 'bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-blue-500/50'
                }`}
                whileHover={{ scale: 1.03, y: -6 }}
                whileTap={{ scale: 0.95 }}
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
                      <p className={`font-bold text-2xl mb-2 text-white ${isFullyScanned ? 'line-through' : ''}`}>{item.name}</p>
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
                          <span className={`text-lg font-bold ${
                            isFullyScanned ? 'text-green-400' : 
                            isPartiallyScanned ? 'text-yellow-400' : 
                            'text-white'
                          }`}>
                            {scannedCount}/{item.quantity}
                          </span>
                        </div>
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
                      className={`h-full transition-all duration-500 ${
                        isFullyScanned 
                          ? 'bg-gradient-to-r from-green-400 to-green-500' 
                          : isPartiallyScanned
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                          : 'bg-gradient-to-r from-blue-400 to-blue-500'
                      }`}
                      style={{ width: `${(scannedCount / item.quantity) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 text-center border border-white/10">
            <BarChart3 className="mx-auto mb-2 text-blue-400" size={24} />
            <p className="text-3xl font-bold">{scannedItems.length}</p>
            <p className="text-sm text-gray-400">Items Scanned</p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 text-center border border-white/10">
            <Package className="mx-auto mb-2 text-purple-400" size={24} />
            <p className="text-3xl font-bold">{tote.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
            <p className="text-sm text-gray-400">Total Items</p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 text-center border border-white/10">
            <Layers className="mx-auto mb-2 text-yellow-400" size={24} />
            <p className="text-3xl font-bold">{tote.items.filter(item => isItemFullyScanned(item.id)).length}/{tote.items.length}</p>
            <p className="text-sm text-gray-400">SKUs Complete</p>
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