import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  DollarSign,
  ScanLine,
  MapPin,
  ArrowLeft,
  TrendingUp,
  Clock,
  Star,
  Sparkles,
  Users,
  Target,
  Zap,
  Award
} from 'lucide-react';
// Date formatting utility
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

import { useWarehouse } from '../hooks/useWarehouseContext';
import BackButton from '../components/BackButton';
import ParticleEffect from '../components/ParticleEffect';

// Confetti component for celebrations
const Confetti = ({ active }) => {
  if (!active) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][i % 5],
            left: `${Math.random() * 100}%`,
            top: '-10px'
          }}
          initial={{ y: -10, opacity: 1, rotate: 0 }}
          animate={{ 
            y: window.innerHeight + 10, 
            opacity: 0, 
            rotate: 360,
            x: (Math.random() - 0.5) * 200
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 0.5,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

// Enhanced particle effect for item received
const ItemReceivedEffect = ({ trigger, onComplete }) => {
  if (!trigger) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <motion.div
        className="absolute top-1/2 left-1/2 text-2xl font-bold text-blue-400"
        initial={{ scale: 0, opacity: 0, x: '-50%', y: '-50%' }}
        animate={{ 
          scale: [0, 1.2, 1],
          opacity: [0, 1, 0],
          y: ['-50%', '-200%'],
          x: '-50%'
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        onAnimationComplete={onComplete}
      >
        +10 XP ✨
      </motion.div>
      
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400 rounded-full"
          style={{
            top: '50%',
            left: '50%'
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ 
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
            x: Math.cos(i * 45 * Math.PI / 180) * 100,
            y: Math.sin(i * 45 * Math.PI / 180) * 100
          }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

// Scan Input Component
const ScanInput = ({ onScan, placeholder, disabled }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onScan(value.trim());
      setValue('');
    }
  };

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  return (
    <div className="relative">
      <motion.div
        className="relative"
        whileFocus={{ scale: 1.02 }}
      >
        <ScanLine className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
        />
        {!disabled && (
          <motion.div
            className="absolute right-4 top-1/2 transform -translate-y-1/2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Smart Bin Selector Component
const SmartBinSelector = ({ onSelect, availableBins, item }) => {
  const [selectedZone, setSelectedZone] = useState('all');
  
  const zones = ['all', 'A', 'B', 'C', 'D', 'E'];
  
  // Smart recommendations logic
  const getRecommendedBins = () => {
    if (!item || !availableBins) return [];
    
    const recommendations = [];
    
    // 1. Bins with same SKU
    const sameSKUBins = availableBins.filter(bin => 
      bin.currentStock.some(stock => stock.sku === item.sku)
    ).slice(0, 2);
    
    // 2. Emptiest bins in preferred zones (A, B for this example)
    const preferredZoneBins = availableBins
      .filter(bin => ['A', 'B'].includes(bin.zone))
      .sort((a, b) => {
        const aStock = a.currentStock.reduce((sum, stock) => sum + stock.quantity, 0);
        const bStock = b.currentStock.reduce((sum, stock) => sum + stock.quantity, 0);
        return aStock - bStock;
      })
      .slice(0, 3 - sameSKUBins.length);
    
    recommendations.push(...sameSKUBins, ...preferredZoneBins);
    return recommendations.slice(0, 3);
  };

  const filteredBins = availableBins?.filter(bin => 
    selectedZone === 'all' || bin.id.startsWith(selectedZone)
  ) || [];

  const recommendedBins = getRecommendedBins();

  return (
    <div className="space-y-6">
      {/* Recommended Bins */}
      {recommendedBins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-xl border border-blue-500/20"
        >
          <div className="flex items-center mb-3">
            <Sparkles className="mr-2 text-blue-400" size={20} />
            <h4 className="font-semibold text-blue-400">Recommended Locations</h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {recommendedBins.map((bin, index) => {
              const stockLevel = bin.currentStock.reduce((sum, stock) => sum + stock.quantity, 0);
              const hasSameSKU = bin.currentStock.some(stock => stock.sku === item?.sku);
              
              return (
                <motion.button
                  key={bin.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect(bin)}
                  className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 rounded-lg transition-all duration-200 border border-blue-500/30 relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-2">
                      <MapPin className="text-blue-400" size={24} />
                      {hasSameSKU && (
                        <Star className="ml-1 text-yellow-400" size={12} />
                      )}
                    </div>
                    <p className="font-medium text-white">{bin.id}</p>
                    <p className="text-xs text-blue-300">
                      {stockLevel} / {bin.capacity}
                    </p>
                    {hasSameSKU && (
                      <p className="text-xs text-yellow-400 mt-1">Same SKU</p>
                    )}
                  </div>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Zone Filter */}
      <div>
        <h4 className="font-semibold mb-3 text-gray-300">Browse All Locations</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {zones.map(zone => (
            <motion.button
              key={zone}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedZone(zone)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedZone === zone 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {zone === 'all' ? 'All Zones' : `Zone ${zone}`}
            </motion.button>
          ))}
        </div>
        
        <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto custom-scrollbar">
          {filteredBins.map((bin, index) => {
            const stockLevel = bin.currentStock.reduce((sum, stock) => sum + stock.quantity, 0);
            const fillPercentage = (stockLevel / bin.capacity) * 100;
            
            return (
              <motion.button
                key={bin.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(bin)}
                className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all duration-200 border border-gray-700 hover:border-gray-600 relative overflow-hidden"
              >
                <MapPin className="mx-auto mb-2 text-gray-400" size={16} />
                <p className="font-medium text-sm text-white">{bin.id}</p>
                <p className="text-xs text-gray-400 mb-2">
                  {stockLevel} / {bin.capacity}
                </p>
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <motion.div 
                    className={`h-1 rounded-full ${
                      fillPercentage > 80 ? 'bg-red-500' :
                      fillPercentage > 60 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPercentage}%` }}
                    transition={{ delay: index * 0.02 + 0.2, duration: 0.5 }}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Stats Dashboard Component
const StatsDashboard = () => {
  const stats = [
    { label: "Items Received Today", value: "127", icon: Package, color: "text-blue-400" },
    { label: "POs Completed Today", value: "8", icon: CheckCircle, color: "text-green-400" },
    { label: "Average Time per Item", value: "45s", icon: Clock, color: "text-purple-400" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="glass-card p-4 rounded-xl text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <stat.icon className={`mx-auto mb-2 ${stat.color} group-hover:scale-110 transition-transform duration-300`} size={24} />
          <motion.p 
            className="text-2xl font-bold mb-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 200 }}
          >
            {stat.value}
          </motion.p>
          <p className="text-xs text-gray-400">{stat.label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
};

const Inwards = () => {
  const { user, addXP, playSound, updateStats } = useWarehouse();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [receivingItem, setReceivingItem] = useState(null);
  const [scannedItemId, setScannedItemId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [bins, setBins] = useState([]);
  const [showBinSelector, setShowBinSelector] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const itemsListRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Mock data for demo
    const mockPurchaseOrders = [
      {
        id: 'PO-2025-001',
        supplier: 'TechSense Ltd',
        expectedDate: '2025-01-15',
        status: 'pending',
        items: [
          { 
            id: 'item-1',
            sku: 'ARM-SENS-001', 
            name: 'PIR Motion Sensor', 
            quantity: 50, 
            receivedQuantity: 0,
            unitCost: 45.00
          },
          { 
            id: 'item-2',
            sku: 'ARM-SIREN-002', 
            name: 'Outdoor Siren 120dB', 
            quantity: 20, 
            receivedQuantity: 0,
            unitCost: 125.00
          },
          { 
            id: 'item-3',
            sku: 'ARM-CAMERA-003', 
            name: 'Security Camera 4K', 
            quantity: 15, 
            receivedQuantity: 0,
            unitCost: 299.00
          }
        ],
        totalValue: 9235,
        notes: 'Handle with care - fragile electronics'
      },
      {
        id: 'PO-2025-002',
        supplier: 'SecureSupply Co',
        expectedDate: '2025-01-16',
        status: 'receiving',
        items: [
          { 
            id: 'item-4',
            sku: 'ARM-CTRL-003', 
            name: 'Smart Control Panel', 
            quantity: 10, 
            receivedQuantity: 7,
            unitCost: 450.00
          },
          { 
            id: 'item-5',
            sku: 'ARM-DOOR-004', 
            name: 'Magnetic Door Contact', 
            quantity: 100, 
            receivedQuantity: 100,
            unitCost: 35.00
          }
        ],
        totalValue: 8000,
        notes: null
      }
    ];

    const mockBins = [];
    const zones = ['A', 'B', 'C', 'D', 'E'];
    zones.forEach(zone => {
      for (let i = 1; i <= 6; i++) {
        for (let j = 1; j <= 8; j++) {
          mockBins.push({
            id: `${zone}-${i.toString().padStart(2, '0')}-${j.toString().padStart(2, '0')}`,
            zone,
            capacity: 100,
            currentStock: Math.random() > 0.7 ? [
              { sku: `ARM-${zone}${i}-${j}`, quantity: Math.floor(Math.random() * 30) + 1 }
            ] : []
          });
        }
      }
    });
    
    setPurchaseOrders(mockPurchaseOrders);
    setBins(mockBins);
  };

  const handleStartReceiving = (po) => {
    setSelectedPO(po);
    playSound('scan');
  };

  const handleItemScan = (barcode) => {
    if (!selectedPO) return;

    // For demo: match based on item ID or find first unfinished item
    const item = selectedPO.items.find(i => 
      i.sku === barcode || 
      i.id === barcode || 
      (i.receivedQuantity < i.quantity)
    );

    if (item && item.receivedQuantity < item.quantity) {
      setReceivingItem(item);
      setScannedItemId(item.id);
      setQuantity(1);
      
      // Scroll to item in list
      setTimeout(() => {
        const itemElement = document.getElementById(`item-${item.id}`);
        if (itemElement && itemsListRef.current) {
          itemElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      playSound('success');
    } else {
      playSound('error');
      console.log('Item not found or already complete');
    }
  };

  const handleConfirmQuantity = () => {
    if (!receivingItem || quantity <= 0) return;
    setShowBinSelector(true);
  };

  const handleBinSelect = (bin) => {
    if (!receivingItem || !selectedPO) return;

    const actualQuantity = Math.min(quantity, receivingItem.quantity - receivingItem.receivedQuantity);

    // Update received quantity
    const updatedPO = {
      ...selectedPO,
      items: selectedPO.items.map(item => 
        item.id === receivingItem.id
          ? { ...item, receivedQuantity: item.receivedQuantity + actualQuantity }
          : item
      )
    };

    // Check if PO is complete
    const isComplete = updatedPO.items.every(
      item => item.receivedQuantity >= item.quantity
    );

    if (isComplete) {
      updatedPO.status = 'completed';
      updatedPO.completedDate = new Date().toISOString();
    }

    setSelectedPO(updatedPO);
    setPurchaseOrders(prev => 
      prev.map(po => po.id === updatedPO.id ? updatedPO : po)
    );

    // Award XP and show animations
    const xpReward = actualQuantity * 10;
    addXP(xpReward, `Received ${actualQuantity} x ${receivingItem.name}`);
    updateStats({
      itemsReceived: (user?.stats?.itemsReceived || 0) + actualQuantity
    });

    // Show particle effect
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1500);

    playSound('success');

    setShowBinSelector(false);
    setReceivingItem(null);
    setScannedItemId(null);
    setQuantity(1);

    if (isComplete) {
      handleCompleteReceiving();
    }
  };

  const handleCompleteReceiving = () => {
    addXP(100, 'Purchase Order Completed');
    updateStats({
      purchaseOrdersCompleted: (user?.stats?.purchaseOrdersCompleted || 0) + 1
    });

    // Show confetti celebration
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    playSound('packComplete');
    
    setTimeout(() => {
      setSelectedPO(null);
    }, 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'receiving': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const calculateProgress = (po) => {
    const totalItems = po.items.reduce((sum, item) => sum + item.quantity, 0);
    const receivedItems = po.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
    return (receivedItems / totalItems) * 100;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <ParticleEffect />
      {/* Back Button */}
      <BackButton />
      
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Inwards Goods
          </h1>
          <p className="text-gray-400 mt-1">Receive and manage incoming inventory</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>Active POs: {purchaseOrders.filter(po => po.status !== 'completed').length}</span>
        </div>
      </motion.div>

      {/* Stats Dashboard */}
      <StatsDashboard />

      {/* Particle Effects */}
      <ItemReceivedEffect trigger={showParticles} onComplete={() => setShowParticles(false)} />
      <Confetti active={showConfetti} />

      <AnimatePresence mode="wait">
        {!selectedPO ? (
          // Purchase Orders List
          <motion.div
            key="po-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {purchaseOrders.map((po, index) => (
                <motion.div
                  key={po.id}
                  layoutId={`po-${po.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="glass-card p-6 rounded-xl cursor-pointer group relative overflow-hidden"
                  onClick={() => handleStartReceiving(po)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <motion.h3 
                          className="text-lg font-semibold"
                          layoutId={`po-title-${po.id}`}
                        >
                          {po.id}
                        </motion.h3>
                        <p className="text-sm text-gray-400">{po.supplier}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(po.status)}`}>
                        {po.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar size={16} className="mr-2 text-blue-400" />
                        Expected: {formatDate(po.expectedDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Package size={16} className="mr-2 text-green-400" />
                        {po.items.length} items ({po.items.reduce((sum, item) => sum + item.quantity, 0)} units)
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <DollarSign size={16} className="mr-2 text-yellow-400" />
                        ${po.totalValue.toLocaleString()}
                      </div>
                    </div>

                    {po.status === 'receiving' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-300">Progress</span>
                          <span className="font-medium">{Math.round(calculateProgress(po))}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${calculateProgress(po)}%` }}
                            transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                          />
                        </div>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartReceiving(po);
                      }}
                    >
                      {po.status === 'pending' ? (
                        <>
                          <Truck className="inline mr-2" size={16} />
                          Start Receiving
                        </>
                      ) : (
                        <>
                          <ScanLine className="inline mr-2" size={16} />
                          Continue Receiving
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          // Receiving Interface
          <motion.div
            key="receiving"
            layoutId={`po-${selectedPO.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <motion.div 
              className="glass-card p-6 rounded-xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.1, x: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedPO(null)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </motion.button>
                  <div>
                    <motion.h2 
                      className="text-2xl font-bold"
                      layoutId={`po-title-${selectedPO.id}`}
                    >
                      Receiving {selectedPO.id}
                    </motion.h2>
                    <p className="text-gray-400">{selectedPO.supplier}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Progress</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {Math.round(calculateProgress(selectedPO))}%
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Two Panel Layout */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Panel - Items List */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6 rounded-xl h-fit"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Package className="mr-2 text-blue-400" />
                    Items to Receive
                  </h3>
                  
                  <div ref={itemsListRef} className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {selectedPO.items.map((item, index) => {
                      const progress = (item.receivedQuantity / item.quantity) * 100;
                      const isComplete = item.receivedQuantity >= item.quantity;
                      const isScanned = scannedItemId === item.id;

                      return (
                        <motion.div
                          key={item.id}
                          id={`item-${item.id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ 
                            opacity: 1, 
                            x: 0,
                            scale: isScanned ? 1.02 : 1,
                            borderColor: isScanned ? '#3b82f6' : 'transparent'
                          }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                            isComplete 
                              ? 'border-green-500/50 bg-green-500/10' 
                              : isScanned
                              ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                              : 'border-gray-700 bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <p className="font-medium text-white">{item.name}</p>
                              <p className="text-sm text-gray-400">{item.sku}</p>
                              <p className="text-xs text-gray-500">
                                ${item.unitCost.toFixed(2)} per unit
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {item.receivedQuantity} / {item.quantity}
                              </p>
                              {isComplete && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex items-center justify-end"
                                >
                                  <CheckCircle className="text-green-400" size={20} />
                                </motion.div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                              <motion.div 
                                className={`h-full rounded-full transition-colors duration-300 ${
                                  isComplete 
                                    ? 'bg-green-500' 
                                    : isScanned
                                    ? 'bg-blue-500'
                                    : 'bg-gradient-to-r from-blue-400 to-purple-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                              />
                            </div>
                          </div>
                          
                          {isScanned && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-3 p-2 bg-blue-500/20 rounded-lg border border-blue-500/30"
                            >
                              <p className="text-sm text-blue-300 flex items-center">
                                <ScanLine className="mr-2" size={16} />
                                Currently scanning this item
                              </p>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Right Panel - Action Panel */}
              <div className="space-y-6">
                {/* Scan Input */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6 rounded-xl"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ScanLine className="mr-2 text-blue-400" />
                    Scan Item
                  </h3>
                  <ScanInput
                    onScan={handleItemScan}
                    placeholder="Scan item barcode or SKU..."
                    disabled={showBinSelector}
                  />
                </motion.div>

                {/* Item Details & Quantity */}
                <AnimatePresence>
                  {receivingItem && (
                    <motion.div
                      initial={{ opacity: 0, x: 20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.9 }}
                      className="glass-card p-6 rounded-xl border border-blue-500/30"
                    >
                      <h4 className="font-semibold mb-3 text-blue-300">Scanned Item</h4>
                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="font-medium">{receivingItem.name}</p>
                          <p className="text-sm text-gray-400">{receivingItem.sku}</p>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Remaining:</span>
                          <span className="font-medium">
                            {receivingItem.quantity - receivingItem.receivedQuantity} units
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Quantity to Receive</label>
                          <input
                            type="number"
                            min="1"
                            max={receivingItem.quantity - receivingItem.receivedQuantity}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                          />
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleConfirmQuantity}
                          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center"
                        >
                          <MapPin className="mr-2" size={16} />
                          Select Bin Location
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Notes */}
            {selectedPO.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5"
              >
                <div className="flex items-start">
                  <AlertCircle className="mr-3 mt-0.5 text-yellow-400 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-yellow-300 mb-1">Special Instructions</p>
                    <p className="text-sm text-yellow-200">{selectedPO.notes}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Bin Selector Modal */}
      <AnimatePresence>
        {showBinSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900/95 backdrop-blur-xl p-6 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center">
                  <MapPin className="mr-3 text-blue-400" />
                  Select Bin Location
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowBinSelector(false);
                    setReceivingItem(null);
                    setScannedItemId(null);
                  }}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  ✕
                </motion.button>
              </div>
              
              {receivingItem && (
                <div className="mb-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <p className="text-sm text-blue-300 mb-1">Placing into bin:</p>
                  <p className="font-medium">{quantity} x {receivingItem.name}</p>
                  <p className="text-sm text-gray-400">{receivingItem.sku}</p>
                </div>
              )}
              
              <SmartBinSelector
                onSelect={handleBinSelect}
                availableBins={bins.filter(bin => 
                  bin.currentStock.reduce((sum, stock) => sum + stock.quantity, 0) < bin.capacity * 0.9
                )}
                item={receivingItem}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(75, 85, 99, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default Inwards;