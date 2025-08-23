import React, { useState, useEffect, useMemo, useCallback, memo, useReducer, Suspense, lazy, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  Edit3,
  X,
  Clock,
  Shield,
  Trophy,
  Activity,
  Database,
  Layers,
  MapPin,
  FileText,
  Printer,
  Info,
  ArrowRight
} from 'lucide-react';
import { useWarehouse } from '../hooks/useWarehouseContext';
import toast from 'react-hot-toast';
import GameIcon from '../components/GameIcon';
import AnimatedCounter from '../components/AnimatedCounter';
import BackButton from '../components/BackButton';
import { playSound } from '../utils/audio';
import { formatDistanceToNow } from 'date-fns';
import Confetti from '../components/Confetti';
// Lazy load heavy components (only for components that are not critical)
const AnimatedCharts = lazy(() => import('../components/AnimatedCharts'));
const ParticleEffect = lazy(() => import('../components/ParticleEffect'));
import { getItemIconType } from '../config/gameIconConstants';
import { useDebounce } from '../hooks/useDebounce';
import { useThrottle } from '../hooks/useThrottle';
import VirtualStockGrid from '../components/VirtualStockGrid';
import binsData from '../data/bins.json';
import productsData from '../data/products.json';
import stockTakesData from '../data/stockTakes.json';

// State management reducer for complex UI state
const uiReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_MODAL':
      return { ...state, [action.modal]: action.value };
    case 'SET_SELECTED_ITEM':
      return { ...state, selectedItem: action.item, showDetailsPanel: !!action.item };
    case 'SET_FILTER':
      return { ...state, filterType: action.filterType };
    case 'SET_SORT':
      return { ...state, sortBy: action.sortBy };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.viewMode };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };
    case 'SHOW_ACHIEVEMENT':
      return { ...state, showAchievement: action.achievement, showConfetti: true };
    case 'HIDE_ACHIEVEMENT':
      return { ...state, showAchievement: null, showConfetti: false };
    default:
      return state;
  }
};

const StockControl = () => {
  const { addXP } = useWarehouse();
  
  // Consolidated UI state using useReducer
  const [uiState, dispatch] = useReducer(uiReducer, {
    selectedItem: null,
    showDetailsPanel: false,
    showAdjustModal: false,
    showAddStockModal: false,
    showAuditModal: false,
    showConfetti: false,
    showAchievement: null,
    searchQuery: '',
    filterType: 'all',
    sortBy: 'name',
    viewMode: 'grid'
  });
  
  const debouncedSearchQuery = useDebounce(uiState.searchQuery, 300);
  
  // Core data states with caching
  const [stockItems, setStockItems] = useState([]);
  const [stockDataCache, setStockDataCache] = useState(null);
  const [lastCacheUpdate, setLastCacheUpdate] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockCount: 0,
    criticalCount: 0,
    perfectAudits: 0
  });

  // Achievement tracking
  const [achievements, setAchievements] = useState({
    firstAdjustment: false,
    perfectAudit: false,
    zeroDiscrepancy: false,
    stockHero: false
  });

  // Warehouse state group
  const [warehouseState, setWarehouseState] = useState({
    binData: [],
    selectedBin: null,
    hoveredBin: null,
    heatmapMode: 'utilization',
    showHeatmapLegend: true,
    transferMode: false,
    sourceBin: null,
    targetBin: null,
    showTransferSection: false,
    selectedTransferStock: null,
    transferQuantity: 1,
    selectedTransferZone: '',
    selectedTransferBin: '',
    showBinAuditModal: false
  });

  useEffect(() => {
    loadStockData();
    // Also load bin data immediately
    const bins = binsData.bins.map(bin => ({
      ...bin,
      stockInfo: bin.currentStock.map(stock => ({
        ...stock,
        item: null, // Will be populated when stock items load
        name: `Product ${stock.sku}`
      }))
    }));
    setWarehouseState(prev => ({ ...prev, binData: bins }));
    
    const interval = setInterval(loadStockData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadBinData = useCallback(() => {
    // Always load bin data to ensure it's current
    const bins = binsData.bins.map(bin => ({
      ...bin,
      // Map bin stock to our stock items
      stockInfo: bin.currentStock.map(stock => {
        const matchingItem = stockItems.find(item => item.sku === stock.sku);
        return {
          ...stock,
          item: matchingItem,
          name: matchingItem?.name || `Product ${stock.sku}`
        };
      })
    }));
    setWarehouseState(prev => ({ ...prev, binData: bins }));
  }, [stockItems]);

  useEffect(() => {
    if (stockItems.length > 0) {
      loadBinData();
    }
  }, [stockItems, loadBinData]);

  const updateStockStats = useCallback((items) => {
    // Calculate total unique SKUs and total quantity
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.value)), 0);
    
    // Count items by status
    const lowStockCount = items.filter(item => item.status === 'low').length;
    const criticalCount = items.filter(item => item.status === 'critical').length;
    
    // Calculate perfect audits from stock takes
    const perfectAudits = stockTakesData.stockTakes
      .filter(st => st.status === 'completed')
      .reduce((count, st) => {
        // Count audits with zero variance
        if (st.counts) {
          const perfectCounts = st.counts.filter(c => c.variance === 0).length;
          return count + perfectCounts;
        }
        // For completed stock takes with summary, use accuracy rate
        if (st.summary && st.summary.accuracyRate >= 100) {
          return count + 1;
        }
        return count;
      }, 0);
    
    setStats({
      totalItems: totalQuantity,
      totalValue: totalValue,
      lowStockCount: lowStockCount,
      criticalCount: criticalCount,
      perfectAudits: perfectAudits
    });
  }, []);

  const loadStockData = useCallback(() => {
    // Check cache validity (5 minutes)
    const now = Date.now();
    if (stockDataCache && lastCacheUpdate && (now - lastCacheUpdate) < 300000) {
      setStockItems(stockDataCache);
      return;
    }
    
    // Create a map of current stock from all bins
    const stockMap = new Map();
    
    // Aggregate stock quantities from all bins
    binsData.bins.forEach(bin => {
      bin.currentStock.forEach(stock => {
        const existing = stockMap.get(stock.sku) || { quantity: 0, locations: [] };
        existing.quantity += stock.quantity;
        existing.locations.push({
          binId: bin.id,
          quantity: stock.quantity,
          lastUpdated: stock.lastUpdated
        });
        stockMap.set(stock.sku, existing);
      });
    });

    // Combine product data with current stock
    const stockItems = productsData.products.map((product, index) => {
      const stockInfo = stockMap.get(product.sku) || { quantity: 0, locations: [] };
      const quantity = stockInfo.quantity;
      const reorderPoint = product.reorderPoint || 50;
      const maxStock = reorderPoint * 5;
      
      // Calculate status based on quantity and reorder point
      const status = quantity === 0 ? 'critical' :
                    quantity <= reorderPoint * 0.5 ? 'critical' : 
                    quantity <= reorderPoint ? 'low' : 'healthy';
      
      // Find the primary location (bin with most stock)
      const primaryLocation = stockInfo.locations.length > 0
        ? stockInfo.locations.reduce((max, loc) => loc.quantity > max.quantity ? loc : max).binId
        : 'UNASSIGNED';
      
      // Calculate movement based on history (simplified for now)
      const movement = quantity > reorderPoint * 2 ? 'slow' : 
                      quantity > reorderPoint ? 'medium' : 'fast';
      
      return {
        id: `STK-${(index + 1).toString().padStart(4, '0')}`,
        sku: product.sku,
        name: product.name,
        category: product.category,
        quantity,
        reorderPoint,
        maxStock,
        location: primaryLocation,
        locations: stockInfo.locations,
        lastUpdated: stockInfo.locations.length > 0 
          ? new Date(Math.max(...stockInfo.locations.map(l => new Date(l.lastUpdated))))
          : new Date(),
        lastAudit: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        value: product.price.toFixed(2),
        status,
        movement,
        history: generateMovementHistory(),
        product
      };
    });

    setStockItems(stockItems);
    updateStockStats(stockItems);
    
    // Update cache
    setStockDataCache(stockItems);
    setLastCacheUpdate(Date.now());
  }, [updateStockStats, stockDataCache, lastCacheUpdate]);

  const generateMovementHistory = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      in: Math.floor(Math.random() * 50),
      out: Math.floor(Math.random() * 50)
    })).reverse();
  };

  const handleItemClick = useCallback((item) => {
    playSound('click');
    startTransition(() => {
      dispatch({ type: 'SET_SELECTED_ITEM', item });
      addXP(5, 'Item Inspection');
    });
  }, [addXP]);

  const handleAdjustStock = useCallback((item, adjustment) => {
    playSound('success');
    
    // Update stock
    setStockItems(prev => {
      const updatedItems = prev.map(i => {
        if (i.id === item.id) {
          const newQuantity = Math.max(0, i.quantity + adjustment);
          const newStatus = newQuantity === 0 ? 'critical' :
                          newQuantity <= i.reorderPoint * 0.5 ? 'critical' : 
                          newQuantity <= i.reorderPoint ? 'low' : 'healthy';
          
          return { 
            ...i, 
            quantity: newQuantity, 
            status: newStatus,
            lastUpdated: new Date() 
          };
        }
        return i;
      });
      
      // Update stats immediately with new data
      updateStockStats(updatedItems);
      return updatedItems;
    });

    // Award XP
    addXP(20, 'Stock Adjustment');
    
    // Check achievements
    if (!achievements.firstAdjustment) {
      setAchievements(prev => ({ ...prev, firstAdjustment: true }));
      addXP(50, 'First Adjustment!');
      playSound('achievement');
      dispatch({ type: 'SHOW_ACHIEVEMENT', achievement: { name: 'First Adjustment!', xp: 50 } });
    }

    toast.success(`Stock ${adjustment > 0 ? 'added' : 'removed'} successfully`);
  }, [addXP, achievements.firstAdjustment, updateStockStats]);


  const handleAudit = (item, auditData) => {
    playSound('success');
    
    const discrepancy = Math.abs(item.quantity - auditData.counted);
    
    if (discrepancy === 0) {
      addXP(50, 'Perfect Audit!');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      
      if (!achievements.perfectAudit) {
        setAchievements(prev => ({ ...prev, perfectAudit: true }));
        addXP(100, 'Achievement: Perfect Audit!');
        playSound('achievement');
        dispatch({ type: 'SHOW_ACHIEVEMENT', achievement: { name: 'Perfect Audit Master!', xp: 100 } });
      }
    } else {
      addXP(30, 'Audit Complete');
    }

    // Update item
    setStockItems(prev => {
      const updatedItems = prev.map(i => {
        if (i.id === item.id) {
          const newQuantity = auditData.counted;
          const newStatus = newQuantity === 0 ? 'critical' :
                          newQuantity <= i.reorderPoint * 0.5 ? 'critical' : 
                          newQuantity <= i.reorderPoint ? 'low' : 'healthy';
          
          return { 
            ...i, 
            quantity: newQuantity, 
            status: newStatus,
            lastAudit: new Date() 
          };
        }
        return i;
      });
      
      // Update stats immediately with new data
      updateStockStats(updatedItems);
      return updatedItems;
    });

    toast.success('Audit completed successfully');
  };

  // Memoized filtering and sorting for optimal performance
  const filteredItems = useMemo(() => {
    if (!stockItems.length) return [];
    
    return stockItems
      .filter(item => {
        // Apply search filter only if there's a debounced query
        if (debouncedSearchQuery) {
          const query = debouncedSearchQuery.toLowerCase();
          const matchesSearch = item.name.toLowerCase().includes(query) ||
                              item.sku.toLowerCase().includes(query) ||
                              item.location.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }
        
        // Apply type filter
        return uiState.filterType === 'all' || item.status === uiState.filterType;
      })
      .sort((a, b) => {
        switch (uiState.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'quantity':
            return b.quantity - a.quantity;
          case 'location':
            return a.location.localeCompare(b.location);
          case 'lastUpdated':
            return new Date(b.lastUpdated) - new Date(a.lastUpdated);
          default:
            return 0;
        }
      });
  }, [stockItems, debouncedSearchQuery, uiState.filterType, uiState.sortBy]);

  // Optimized event handlers with throttling
  const throttledPlaySound = useThrottle((soundType) => playSound(soundType), 100);
  
  const handleSearchChange = useCallback((e) => {
    startTransition(() => {
      dispatch({ type: 'SET_SEARCH', query: e.target.value });
    });
    throttledPlaySound('type');
  }, [throttledPlaySound]);
  
  const handleFilterChange = useCallback((newFilter) => {
    startTransition(() => {
      dispatch({ type: 'SET_FILTER', filterType: newFilter });
    });
    playSound('click');
  }, []);
  
  const handleSortChange = useCallback((newSort) => {
    dispatch({ type: 'SET_SORT', sortBy: newSort });
    playSound('click');
  }, []);
  
  const handleViewModeChange = useCallback((newMode) => {
    dispatch({ type: 'SET_VIEW_MODE', viewMode: newMode });
    playSound('click');
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <ParticleEffect />
      </Suspense>
      <motion.div 
        className="min-h-screen relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
      {uiState.showConfetti && <Confetti />}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradientShift {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          @keyframes transferFlashSource {
            0%, 100% { fill: #ef4444; stroke: #ef4444; stroke-width: 3; }
            50% { fill: #dc2626; stroke: #dc2626; stroke-width: 5; }
          }
          
          @keyframes transferFlashTarget {
            0%, 100% { fill: #10b981; stroke: #10b981; stroke-width: 3; }
            50% { fill: #059669; stroke: #059669; stroke-width: 5; }
          }
          
          .transfer-flash-source rect {
            animation: transferFlashSource 0.5s ease-in-out 2;
          }
          
          .transfer-flash-target rect {
            animation: transferFlashTarget 0.5s ease-in-out 2;
          }
        `
      }} />
      
      <div className="relative z-10 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="mb-8"
        >
          <BackButton />
          
          <motion.div 
            className="mt-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-green-500/10"
              animate={{
                background: [
                  "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(147,51,234,0.1) 50%, rgba(34,197,94,0.1) 100%)",
                  "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(59,130,246,0.1) 50%, rgba(147,51,234,0.1) 100%)",
                  "linear-gradient(135deg, rgba(147,51,234,0.1) 0%, rgba(34,197,94,0.1) 50%, rgba(59,130,246,0.1) 100%)",
                ],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
                  initial={{ 
                    x: Math.random() * 100 + "%",
                    y: 100 + "%",
                  }}
                  animate={{
                    y: -20,
                    x: Math.random() * 100 + "%",
                  }}
                  transition={{
                    duration: Math.random() * 10 + 10,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "linear"
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10 flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    y: [0, -5, 0]
                  }}
                  transition={{ 
                    rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
                  <GameIcon 
                    iconType="warehouse" 
                    size={80} 
                    tier="mega"
                    quantity={stats.totalItems}
                    animated={true}
                  />
                </motion.div>
                <div>
                  <motion.h1 
                    className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    style={{ backgroundSize: "200% 200%" }}
                  >
                    Stock Control Center
                  </motion.h1>
                  <motion.div 
                    className="text-gray-400 mt-2 flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      <Activity size={16} />
                    </motion.div>
                    Real-time inventory management and optimization
                  </motion.div>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => playSound('hover')}
                onClick={() => setShowAddStockModal(true)}
                className="relative px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-medium shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 flex items-center gap-2 overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <motion.div
                  animate={{ rotate: [0, 180, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="relative z-10"
                >
                  <Plus size={20} />
                </motion.div>
                <span className="relative z-10">Add Stock</span>
                
                {/* Sparkle effects on hover */}
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4"
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="w-full h-full bg-yellow-300 rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </motion.div>
              </motion.button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {[
                { 
                  label: 'Total Items', 
                  value: stats.totalItems, 
                  icon: Package, 
                  color: 'blue',
                  tier: 'rare'
                },
                { 
                  label: 'Total Value', 
                  value: stats.totalValue, 
                  icon: Database, 
                  color: 'purple',
                  tier: 'legendary',
                  prefix: '$'
                },
                { 
                  label: 'Low Stock', 
                  value: stats.lowStockCount, 
                  icon: TrendingDown, 
                  color: 'yellow',
                  tier: 'common'
                },
                { 
                  label: 'Critical', 
                  value: stats.criticalCount, 
                  icon: AlertTriangle, 
                  color: 'red',
                  tier: 'epic'
                },
                { 
                  label: 'Perfect Audits', 
                  value: stats.perfectAudits, 
                  icon: Trophy, 
                  color: 'green',
                  tier: 'legendary'
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: index * 0.1, 
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -2,
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                  onMouseEnter={() => playSound('hover')}
                  className={`relative bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/[0.05] transition-all duration-300 overflow-hidden group perspective-1000`}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <GameIcon 
                      iconType={stat.icon === Package ? 'package' : 
                               stat.icon === Database ? 'database' :
                               stat.icon === AlertTriangle ? 'warning' :
                               stat.icon === Trophy ? 'trophy' : 'box'}
                      size={32}
                      tier={stat.tier === 'legendary' ? 'mega' : 
                            stat.tier === 'epic' ? 'super' : 
                            stat.tier === 'rare' ? 'standard' : 'normal'}
                      animated={true}
                    />
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  {/* Animated background glow */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />
                  
                  {/* Simplified hover effect */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className={`w-full h-full bg-${stat.color}-400 rounded-full`} />
                  </div>
                  
                  {/* Stat value */}
                  <motion.div 
                    className="text-2xl font-bold text-white relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    {typeof stat.value === 'number' ? (
                      <AnimatedCounter 
                        target={stat.value} 
                        duration={1000} 
                        prefix={stat.prefix || ''}
                        suffix={stat.suffix || ''}
                      />
                    ) : (
                      <motion.span
                        className="inline-block"
                        animate={{
                          textShadow: [
                            "0 0 10px rgba(255,255,255,0.5)",
                            "0 0 20px rgba(59,130,246,0.8)",
                            "0 0 10px rgba(255,255,255,0.5)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {stat.value}
                      </motion.span>
                    )}
                  </motion.div>
                  
                  <motion.div 
                    className="text-sm text-gray-400 flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {stat.label}
                    {/* Sparkle indicator for achievements */}
                    {stat.label === 'Perfect Audits' && stat.value > 0 && (
                      <motion.span
                        className="inline-block w-2 h-2 bg-yellow-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  
                  {/* 3D hover effect overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ transform: "translateZ(20px)" }}
                  />
                  
                  {/* Corner accent */}
                  <motion.div
                    className="absolute top-0 right-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    initial={{ scale: 0, rotate: 0 }}
                    whileHover={{ scale: 1, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <div className={`w-full h-full border-t-2 border-r-2 border-${stat.color}-400 rounded-tr-2xl`} />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Controls Bar with Epic Effects */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            delay: 0.2, 
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
          className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6 overflow-hidden group"
        >
          {/* Animated border gradient */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: "linear-gradient(135deg, transparent 30%, rgba(59,130,246,0.3) 50%, transparent 70%)",
              backgroundSize: "200% 200%",
            }}
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <motion.div
                className="absolute left-4 top-1/2 transform -translate-y-1/2"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Search className="text-gray-400" size={20} />
              </motion.div>
              <input
                type="text"
                value={uiState.searchQuery}
                onChange={handleSearchChange}
                onFocus={() => playSound('focus')}
                placeholder="Search by name, SKU, or location..."
                className="w-full pl-12 pr-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/[0.08] group"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {['all', 'healthy', 'low', 'critical'].map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => playSound('hover')}
                  onClick={() => handleFilterChange(type)}
                  className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 overflow-hidden ${
                    uiState.filterType === type
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'
                  }`}
                >
                  {/* Hover sweep effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative z-10">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                  {type !== 'all' && (
                    <motion.span 
                      className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full relative z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      {stockItems.filter(i => type === 'all' || i.status === type).length}
                    </motion.span>
                  )}
                  {/* Active pulse effect */}
                  {uiState.filterType === type && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      animate={{
                        boxShadow: [
                          "0 0 0 0 rgba(59,130,246,0.4)",
                          "0 0 0 10px rgba(59,130,246,0)",
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Sort & View */}
            <div className="flex gap-2">
              <motion.select
                value={uiState.sortBy}
                onChange={(e) => {
                  startTransition(() => {
                    dispatch({ type: 'SET_SORT', sortBy: e.target.value });
                  });
                  playSound('click');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-white/[0.05] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/[0.08] transition-all duration-300 cursor-pointer appearance-none pr-10 [&>option]:bg-gray-800 [&>option]:text-white"
              >
                <option value="name">Sort by Name</option>
                <option value="quantity">Sort by Quantity</option>
                <option value="location">Sort by Location</option>
                <option value="lastUpdated">Sort by Last Updated</option>
              </motion.select>
              
              {/* Custom dropdown arrow with animation */}
              <motion.div 
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingDown size={16} className="text-gray-400" />
              </motion.div>

              <motion.div 
                className="flex bg-white/[0.05] rounded-xl p-1 relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                {/* Animated background indicator */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl"
                  layoutId="viewModeIndicator"
                  initial={false}
                  animate={{
                    x: uiState.viewMode === 'grid' ? '0%' : uiState.viewMode === 'list' ? '33.33%' : '66.66%',
                    width: '33.33%'
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                
                {['grid', 'list', 'warehouse'].map((mode) => (
                  <motion.button
                    key={mode}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      startTransition(() => {
                        dispatch({ type: 'SET_VIEW_MODE', viewMode: mode });
                      });
                      playSound('click');
                    }}
                    className={`relative px-3 py-1.5 rounded-lg transition-all duration-300 z-10 ${
                      uiState.viewMode === mode
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={uiState.viewMode === mode ? {
                          rotate: [0, 10, -10, 0],
                        } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {mode === 'grid' ? (
                          <Layers size={18} />
                        ) : mode === 'list' ? (
                          <Database size={18} />
                        ) : (
                          <MapPin size={18} />
                        )}
                      </motion.div>
                      <span className="text-sm capitalize">{mode}</span>
                    </div>
                    
                    {/* Icon glow effect when active */}
                    {uiState.viewMode === mode && (
                      <motion.div
                        className="absolute inset-0 rounded-lg"
                        animate={{
                          boxShadow: [
                            "0 0 10px rgba(59,130,246,0.5)",
                            "0 0 20px rgba(147,51,234,0.5)",
                            "0 0 10px rgba(59,130,246,0.5)",
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stock Items Grid/List/Warehouse */}
        {uiState.viewMode === 'warehouse' ? (
          warehouseState.binData.length > 0 ? (
            <WarehouseView
              key="warehouse-view"
              binData={warehouseState.binData}
              stockItems={stockItems}
              selectedBin={warehouseState.selectedBin}
              hoveredBin={warehouseState.hoveredBin}
              onBinHover={(bin) => setWarehouseState(prev => ({ ...prev, hoveredBin: bin }))}
              onBinClick={(bin) => {
                setWarehouseState(prev => ({ ...prev, selectedBin: bin }));
                playSound('click');
              }}
              onItemClick={handleItemClick}
              onBinUpdate={(updatedBin) => {
                // Update bin data
                setWarehouseState(prev => ({
                  ...prev,
                  binData: prev.binData.map(bin => 
                    bin.id === updatedBin.id ? updatedBin : bin
                  )
                }));
                
                // Trigger stock data reload
                loadStockData();
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-96 bg-white/[0.03] border border-white/10 rounded-2xl">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading warehouse layout...</p>
              </div>
            </div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            {uiState.viewMode === 'grid' && filteredItems.length > 20 ? (
              <VirtualStockGrid
                items={filteredItems}
                viewMode={uiState.viewMode}
                onItemClick={handleItemClick}
                onQuickAdjust={handleAdjustStock}
                containerHeight={600}
                StockItemCard={StockItemCard}
              />
            ) : (
              <div className={uiState.viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'
                : 'space-y-4'
              }>
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item, index) => (
                    <StockItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      viewMode={uiState.viewMode}
                      onClick={() => handleItemClick(item)}
                      onQuickAdjust={(adjustment) => handleAdjustStock(item, adjustment)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Details Panel */}
      <AnimatePresence>
        {uiState.showDetailsPanel && uiState.selectedItem && (
          <StockDetailsPanel
            item={uiState.selectedItem}
            onClose={() => {
              dispatch({ type: 'SET_SELECTED_ITEM', item: null });
            }}
            onAdjust={() => {
              dispatch({ type: 'TOGGLE_MODAL', modal: 'showAdjustModal', value: true });
              playSound('click');
            }}
            onAudit={() => {
              dispatch({ type: 'TOGGLE_MODAL', modal: 'showAuditModal', value: true });
              playSound('click');
            }}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {uiState.showAdjustModal && uiState.selectedItem && (
          <AdjustStockModal
            item={selectedItem}
            onAdjust={handleAdjustStock}
            onClose={() => setShowAdjustModal(false)}
          />
        )}

        {uiState.showAuditModal && uiState.selectedItem && (
          <AuditModal
            item={selectedItem}
            onAudit={handleAudit}
            onClose={() => setShowAuditModal(false)}
          />
        )}

        {uiState.showAddStockModal && (
          <AddStockModal
            onAdd={(newItem) => {
              const newItems = [...stockItems, { ...newItem, id: `STK-${Date.now()}` }];
              setStockItems(newItems);
              updateStockStats(newItems);
              addXP(30, 'New Stock Added');
              playSound('success');
              toast.success('Stock item added successfully');
            }}
            onClose={() => setShowAddStockModal(false)}
          />
        )}
        
        {uiState.showAchievement && (
          <AchievementPopup
            achievement={uiState.showAchievement}
            onClose={() => dispatch({ type: 'HIDE_ACHIEVEMENT' })}
          />
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
};

// Define components outside of StockControl

// Stock Item Card Component  
const StockItemCard = memo(React.forwardRef(({ item, index, viewMode, onClick, onQuickAdjust }, ref) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const statusColors = {
    healthy: 'from-green-500 to-emerald-500',
    low: 'from-purple-500 to-purple-600',
    critical: 'from-red-500 to-red-600'
  };

  const stockPercentage = (item.quantity / item.maxStock) * 100;

  if (viewMode === 'list') {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ delay: index * 0.02 }}
          whileHover={{ scale: 1.01 }}
          onClick={onClick}
          onMouseEnter={() => {
            setShowQuickActions(true);
            playSound('hover');
          }}
          onMouseLeave={() => setShowQuickActions(false)}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"
        >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <GameIcon 
              iconType={getItemIconType(item.name, item.sku)} 
              size={40}
              tier={item.status === 'critical' ? 'super' : item.status === 'low' ? 'standard' : 'normal'}
              animated={showQuickActions}
            />
            <div>
              <h3 className="font-semibold text-white">{item.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="font-mono">{item.sku}</span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {item.location}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                <AnimatedCounter target={item.quantity} duration={800} />
              </div>
              <div className="text-sm text-gray-400">units</div>
            </div>

            <div className="w-32">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  className={`h-full bg-gradient-to-r ${statusColors[item.status]}`}
                />
              </div>
            </div>

            <AnimatePresence>
              {showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onQuickAdjust(-1)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                  >
                    <Minus size={16} className="text-red-400" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onQuickAdjust(1)}
                    className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                  >
                    <Plus size={16} className="text-green-400" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
      transition={{ 
        delay: index * 0.05, 
        type: "spring",
        stiffness: 100,
        damping: 10
      }}
      whileHover={{ 
        scale: 1.05, 
        y: -10,
        rotateY: 5,
        transition: { type: "spring", stiffness: 300 }
      }}
      onClick={onClick}
      onMouseEnter={() => playSound('hover')}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/[0.05] transition-all duration-300 cursor-pointer relative overflow-hidden group"
      style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${item.quantity > item.reorderPoint ? '80% 20%' : '20% 80%'}, ${item.status === 'critical' ? 'rgba(239,68,68,0.15)' : item.status === 'low' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'} 0%, transparent 70%)`
        }}
      />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${
              item.status === 'critical' ? 'bg-red-400' : 
              item.status === 'low' ? 'bg-yellow-400' : 
              'bg-green-400'
            }`}
            initial={{ 
              x: Math.random() * 100 + "%",
              y: "100%",
              opacity: 0
            }}
            animate={{
              y: "-20%",
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
      
      {/* Status Badge with pulse effect */}
      <motion.div 
        className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${statusColors[item.status]} text-white shadow-lg z-10`}
        animate={item.status === 'critical' ? {
          scale: [1, 1.1, 1],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.span
          animate={item.status === 'critical' ? {
            opacity: [1, 0.7, 1]
          } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {item.status.toUpperCase()}
        </motion.span>
        {item.status === 'critical' && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <GameIcon 
              iconType={getItemIconType(item.name, item.sku)} 
              size={60}
              tier={item.status === 'critical' ? 'epic' : item.status === 'low' ? 'rare' : 'common'}
              animated={true}
              quantity={item.quantity}
            />
          </motion.div>
          <div className="text-right relative">
            <motion.div 
              className="text-3xl font-bold text-white"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <AnimatedCounter target={item.quantity} duration={800} />
            </motion.div>
            <motion.div 
              className="text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              units
            </motion.div>
            {/* Quantity change indicator */}
            {item.quantity < item.reorderPoint && (
              <motion.div
                className="absolute -right-2 -top-2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle size={16} className="text-yellow-400" />
              </motion.div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg text-white mb-1">{item.name}</h3>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span className="font-mono">{item.sku}</span>
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {item.location}
            </span>
          </div>
        </div>

        {/* Epic Stock Level Bar with glow */}
        <div>
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Stock Level
            </motion.span>
            <motion.span
              className="font-bold"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                color: stockPercentage < 30 ? '#ef4444' : stockPercentage < 60 ? '#f59e0b' : '#10b981'
              }}
            >
              {Math.round(stockPercentage)}%
            </motion.span>
          </div>
          <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
            {/* Animated background pattern */}
            <motion.div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.1) 10px)'
              }}
              animate={{ x: [0, 10] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(stockPercentage, 100)}%` }}
              transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 100 }}
              className={`relative h-full bg-gradient-to-r ${statusColors[item.status]} shadow-lg`}
            >
              {/* Glow effect at the end of the bar */}
              <motion.div
                className="absolute right-0 top-0 bottom-0 w-2 bg-white"
                style={{ 
                  filter: 'blur(4px)',
                  opacity: 0.8
                }}
                animate={{ opacity: [0.8, 0.4, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
            
            {/* Critical indicator */}
            {stockPercentage < 20 && (
              <motion.div
                className="absolute inset-0 bg-red-500 opacity-30"
                animate={{ opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between items-center pt-2"
        >
          <div className="text-xs text-gray-400">
            <Clock size={14} className="inline mr-1" />
            {formatDistanceToNow(item.lastUpdated, { addSuffix: true })}
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onQuickAdjust(-1)}
              className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              <Minus size={14} className="text-red-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onQuickAdjust(1)}
              className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
            >
              <Plus size={14} className="text-green-400" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Epic Hover Effects */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "200% 100%" }}
      />
      
      {/* 3D Border glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent 30%, ${item.status === 'critical' ? 'rgba(239,68,68,0.3)' : item.status === 'low' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'} 50%, transparent 70%)`,
          filter: 'blur(20px)'
        }}
      />
      
      {/* Corner accents */}
      <motion.div
        className="absolute top-0 left-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={{ scale: 0, rotate: 0 }}
        whileHover={{ scale: 1, rotate: 90 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <div className="w-full h-full border-t-2 border-l-2 border-blue-400 rounded-tl-3xl" />
      </motion.div>
      <motion.div
        className="absolute bottom-0 right-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={{ scale: 0, rotate: 0 }}
        whileHover={{ scale: 1, rotate: -90 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <div className="w-full h-full border-b-2 border-r-2 border-blue-400 rounded-br-3xl" />
      </motion.div>
    </motion.div>
  );
}));

// Stock Details Panel
const StockDetailsPanel = memo(({ item, onClose, onAdjust, onAudit }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  
  // Prepare chart data
  const movementData = item.history.map(h => ({
    date: h.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    inbound: h.in,
    outbound: h.out,
    net: h.in - h.out
  }));

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-full max-w-2xl bg-gray-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
    >
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <GameIcon 
              iconType={getItemIconType(item.name, item.sku)} 
              size={60}
              tier={item.status === 'critical' ? 'super' : item.status === 'low' ? 'standard' : 'normal'}
              animated={true}
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{item.name}</h2>
              <p className="text-gray-400 font-mono">{item.sku}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-colors"
          >
            <X size={24} />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          {['overview', 'movement', 'history'].map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab(tab);
                playSound('click');
              }}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Current Stock</span>
                    <Package className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    <AnimatedCounter target={item.quantity} duration={800} />
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {item.quantity > item.reorderPoint ? 'Above reorder point' : 'Below reorder point'}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Total Value</span>
                    <Database className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    ${(item.quantity * parseFloat(item.value)).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    ${item.value} per unit
                  </div>
                </motion.div>
              </div>

              {/* Stock Levels */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Stock Levels</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Current</span>
                    <span className="font-mono text-white">{item.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Reorder Point</span>
                    <span className="font-mono text-yellow-400">{item.reorderPoint}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Maximum</span>
                    <span className="font-mono text-green-400">{item.maxStock}</span>
                  </div>
                  <div className="mt-4 h-4 bg-gray-700 rounded-full overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.quantity / item.maxStock) * 100}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 absolute"
                    />
                    <div 
                      className="absolute h-full w-0.5 bg-yellow-400"
                      style={{ left: `${(item.reorderPoint / item.maxStock) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Location</span>
                    <p className="text-white font-mono mt-1">{item.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Category</span>
                    <p className="text-white mt-1">{item.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Movement</span>
                    <p className="text-white mt-1 capitalize">{item.movement} moving</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Audit</span>
                    <p className="text-white mt-1">
                      {formatDistanceToNow(item.lastAudit, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'movement' && (
            <motion.div
              key="movement"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">7-Day Movement History</h3>
                <div className="h-64">
                  <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
                    <AnimatedCharts
                      data={movementData}
                      lines={[
                        { key: 'inbound', color: '#10b981', label: 'Inbound' },
                        { key: 'outbound', color: '#ef4444', label: 'Outbound' },
                        { key: 'net', color: '#3b82f6', label: 'Net Change' }
                      ]}
                    />
                  </Suspense>
                </div>
              </div>

              {/* Movement Summary */}
              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center"
                >
                  <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {item.history.reduce((sum, h) => sum + h.in, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Inbound</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center"
                >
                  <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {item.history.reduce((sum, h) => sum + h.out, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Outbound</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center"
                >
                  <Activity className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {(item.history.reduce((sum, h) => sum + h.out, 0) / 7).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">Daily Average</div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Audit History</h3>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Cycle Count</p>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-mono">
                          {item.quantity + Math.floor(Math.random() * 20 - 10)}
                        </p>
                        <p className="text-xs text-gray-400">counted</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 space-y-3"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAdjust}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Edit3 size={20} />
            Adjust Stock
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAudit}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Shield size={20} />
            Perform Audit
          </motion.button>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Printer size={18} />
              Print Label
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              Export Data
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

// Adjust Stock Modal
const AdjustStockModal = ({ item, onAdjust, onClose }) => {
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const adjustment = adjustmentType === 'add' ? qty : -qty;
    onAdjust(item, adjustment);
    onClose();
  };

  return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Adjust Stock</h3>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-colors"
          >
            <X size={20} />
          </motion.button>
        </div>

        <div className="space-y-6">
          {/* Item Info */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <GameIcon iconType={getItemIconType(item.name, item.sku)} size={40} tier="normal" />
              <div>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-sm text-gray-400">{item.sku}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-gray-400">Current Stock:</span>
              <span className="font-mono text-white">{item.quantity} units</span>
            </div>
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['add', 'remove'].map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAdjustmentType(type);
                    playSound('click');
                  }}
                  className={`p-3 rounded-xl font-medium transition-all duration-300 ${
                    adjustmentType === type
                      ? type === 'add'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                      : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'
                  }`}
                >
                  {type === 'add' ? <Plus className="inline mr-2" size={18} /> : <Minus className="inline mr-2" size={18} />}
                  {type.charAt(0).toUpperCase() + type.slice(1)} Stock
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onFocus={() => playSound('focus')}
              placeholder="Enter quantity..."
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onFocus={() => playSound('focus')}
              placeholder="Enter reason for adjustment..."
              rows={3}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
            >
              Confirm Adjustment
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-white font-medium transition-all duration-300"
            >
              Cancel
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
    );
};

// Audit Modal
const AuditModal = ({ item, onAudit, onClose }) => {
  const [countedQuantity, setCountedQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const counted = parseInt(countedQuantity);
    if (isNaN(counted) || counted < 0) {
      toast.error('Please enter a valid count');
      return;
    }

    onAudit(item, { counted, notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Stock Audit</h3>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-colors"
          >
            <X size={20} />
          </motion.button>
        </div>

        <div className="space-y-6">
          {/* Item Info */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <GameIcon iconType={getItemIconType(item.name, item.sku)} size={40} tier="super" />
              <div>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-sm text-gray-400">{item.sku} • {item.location}</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">System Quantity:</span>
                <span className="font-mono text-white">{item.quantity} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Last Audit:</span>
                <span className="text-white">
                  {formatDistanceToNow(item.lastAudit, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Physical Count */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Physical Count
            </label>
            <input
              type="number"
              value={countedQuantity}
              onChange={(e) => setCountedQuantity(e.target.value)}
              onFocus={() => playSound('focus')}
              placeholder="Enter counted quantity..."
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
            />
            {countedQuantity && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2"
              >
                <p className="text-sm text-gray-400">
                  Variance: 
                  <span className={`ml-2 font-mono ${
                    parseInt(countedQuantity) === item.quantity 
                      ? 'text-green-400' 
                      : 'text-yellow-400'
                  }`}>
                    {parseInt(countedQuantity) - item.quantity} units
                  </span>
                </p>
              </motion.div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Audit Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onFocus={() => playSound('focus')}
              placeholder="Any observations or notes..."
              rows={3}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
            >
              Complete Audit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-white font-medium transition-all duration-300"
            >
              Cancel
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Add Stock Modal
const AddStockModal = ({ onAdd, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    quantity: '',
    reorderPoint: '',
    maxStock: '',
    location: '',
    value: ''
  });

  const handleSubmit = () => {
    // Validate
    if (!formData.name || !formData.sku || !formData.quantity || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    onAdd({
      ...formData,
      quantity: parseInt(formData.quantity),
      reorderPoint: parseInt(formData.reorderPoint) || 50,
      maxStock: parseInt(formData.maxStock) || parseInt(formData.quantity) * 5,
      value: parseFloat(formData.value) || 0,
      lastUpdated: new Date(),
      lastAudit: new Date(),
      status: 'healthy',
      movement: 'medium',
      history: generateMovementHistory()
    });

    onClose();
  };

  const generateMovementHistory = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      in: 0,
      out: 0
    })).reverse();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Add New Stock Item</h3>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-colors"
          >
            <X size={20} />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onFocus={() => playSound('focus')}
              placeholder="Enter product name..."
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              SKU *
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              onFocus={() => playSound('focus')}
              placeholder="Enter SKU..."
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
            >
              <option value="Electronics">Electronics</option>
              <option value="Apparel">Apparel</option>
              <option value="Food">Food</option>
              <option value="Tools">Tools</option>
              <option value="Office">Office</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              onFocus={() => playSound('focus')}
              placeholder="e.g., A01-3"
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Initial Quantity *
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              onFocus={() => playSound('focus')}
              placeholder="0"
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
            />
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Unit Value ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              onFocus={() => playSound('focus')}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
            />
          </div>

          {/* Reorder Point */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reorder Point
            </label>
            <input
              type="number"
              value={formData.reorderPoint}
              onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
              onFocus={() => playSound('focus')}
              placeholder="50"
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
            />
          </div>

          {/* Max Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Maximum Stock
            </label>
            <input
              type="number"
              value={formData.maxStock}
              onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
              onFocus={() => playSound('focus')}
              placeholder="500"
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300"
          >
            Add Stock Item
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-white font-medium transition-all duration-300"
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

// Warehouse View Component
const WarehouseView = ({ binData, stockItems, selectedBin, hoveredBin, onBinHover, onBinClick, onItemClick, onBinUpdate }) => {
  const { addXP } = useWarehouse();
  const [heatmapMode, setHeatmapMode] = useState('utilization'); // 'utilization', 'movement', 'value'
  const [showHeatmapLegend, setShowHeatmapLegend] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferMode, setTransferMode] = useState(false);
  const [sourceBin, setSourceBin] = useState(null);
  const [targetBin, setTargetBin] = useState(null);
  const [showTransferSection, setShowTransferSection] = useState(false);
  const [selectedTransferStock, setSelectedTransferStock] = useState(null);
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [selectedTransferZone, setSelectedTransferZone] = useState('');
  const [selectedTransferBin, setSelectedTransferBin] = useState('');
  const [showBinAuditModal, setShowBinAuditModal] = useState(false);
  
  // Memoized bin metrics calculation to prevent expensive recalculations
  const binMetricsCache = useMemo(() => {
    const cache = new Map();
    const now = Date.now();
    
    binData.forEach(bin => {
      const totalQuantity = bin.currentStock.reduce((sum, stock) => sum + stock.quantity, 0);
      const utilization = (totalQuantity / bin.capacity) * 100;
      
      // Calculate movement score based on last updated times
      const movementScore = bin.currentStock.reduce((score, stock) => {
        const daysSinceUpdate = (now - new Date(stock.lastUpdated)) / (1000 * 60 * 60 * 24);
        return score + (100 / Math.max(daysSinceUpdate, 1)); // More recent = higher score
      }, 0);
      
      // Calculate value
      const totalValue = bin.currentStock.reduce((sum, stock) => {
        const item = stockItems.find(i => i.sku === stock.sku);
        return sum + (stock.quantity * (item ? parseFloat(item.value) : 0));
      }, 0);
      
      cache.set(bin.id, {
        utilization,
        movementScore: Math.min(movementScore, 100),
        value: totalValue
      });
    });
    
    return cache;
  }, [binData, stockItems]);

  // Fast lookup function for bin metrics
  const getBinMetrics = useCallback((bin) => {
    return binMetricsCache.get(bin?.id) || { utilization: 0, movementScore: 0, value: 0 };
  }, [binMetricsCache]);

  // Safe bin position lookup helper
  const getSafeBinPosition = useCallback((binId) => {
    if (!binId) return { x: 0, y: 0 };
    const bin = binData.find(b => b.id === binId);
    if (!bin) return { x: 0, y: 0 };
    return getBinPosition(bin);
  }, [binData]);
  
  // Group bins by zone
  const binsByZone = binData.reduce((acc, bin) => {
    if (!acc[bin.zone]) acc[bin.zone] = [];
    acc[bin.zone].push(bin);
    return acc;
  }, {});

  // Include PRODUCTION, SMT, ASSEMBLY, and OUT zones even if they don't have bins
  const zonesWithBins = Object.keys(binsByZone);
  const allZones = [...new Set([...zonesWithBins, 'PRODUCTION', 'SMT', 'ASSEMBLY', 'OUT'])];
  const zones = allZones.sort((a, b) => {
    // Custom sort to place zones in the correct order
    const order = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'OUT', 'SMT', 'PRODUCTION', 'ASSEMBLY', 'I'];
    return order.indexOf(a) - order.indexOf(b);
  });

  // Calculate bin position in SVG
  const getBinPosition = (bin) => {
    // PRODUCTION, SMT, ASSEMBLY, and OUT zones don't have bins
    if (bin.zone === 'PRODUCTION' || bin.zone === 'SMT' || bin.zone === 'ASSEMBLY' || bin.zone === 'OUT') {
      return { x: -1000, y: -1000 }; // Position off-screen
    }
    let row = 0;
    let xPosition = 0;
    const zoneWidth = 80;
    const closeGap = 10; // Gap between close zones (B&C, D&E)
    const aisleGap = 60; // Gap for aisles
    
    // Custom positioning for each zone
    switch(bin.zone) {
      case 'A':
        xPosition = 10; // Far left, isolated
        break;
      case 'B':
        xPosition = 10 + zoneWidth + aisleGap; // After A with aisle gap
        break;
      case 'C':
        xPosition = 10 + zoneWidth + aisleGap + zoneWidth + closeGap; // Close to B
        break;
      case 'D':
        xPosition = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap; // After aisle from C
        break;
      case 'E':
        xPosition = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap; // Close to D
        break;
      case 'F':
        xPosition = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap; // After aisle from E
        break;
      case 'G':
        xPosition = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap; // Close to F
        break;
      case 'H':
        xPosition = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap; // Isolated to the right
        break;
      case 'OUT':
        // Position OUT zone between H and I vertically (representing warehouse gate)
        row = 0.5; // Position between row 0 and row 1
        xPosition = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap; // Same x as H and I
        break;
      case 'I':
        row = 1;
        xPosition = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap; // Below H
        break;
      case 'SMT':
        row = 1;
        xPosition = 10; // Start at Zone A position
        break;
      case 'PRODUCTION':
        row = 1;
        xPosition = 10 + zoneWidth + aisleGap + zoneWidth + closeGap; // Start at Zone C position
        break;
      case 'ASSEMBLY':
        row = 1;
        // Position ASSEMBLY at the very right of PRODUCTION zone
        // Calculate where PRODUCTION ends and position ASSEMBLY there
        const gZoneEnd = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap + zoneWidth;
        const h6Position = gZoneEnd + (aisleGap / 2);
        const assemblyWidth = (zoneWidth + closeGap + zoneWidth) / 2 + 20;
        xPosition = h6Position - assemblyWidth; // Position at the right edge
        break;
    }
    
    const zoneCenter = xPosition + zoneWidth / 2;
    const baseY = row * 450 + 50; // Start bins 20px from zone top (zone starts at y=30 for row 0)
    
    // Special positioning for C6 - between zones C and D at the top
    if (bin.id === 'C-06-01') {
      const cZoneX = 10 + zoneWidth + aisleGap + zoneWidth + closeGap;
      const dZoneX = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
      return {
        x: (cZoneX + zoneWidth + dZoneX) / 2, // Centered between C and D zones
        y: 60 // At the top
      };
    }
    
    // Special positioning for E6 and F6 - between zones E and F at the top
    if (bin.id === 'E-06-01' || bin.id === 'F-06-01') { // E-06-01 is E6, F-06-01 is F6
      const eZoneX = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap;
      const fZoneX = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
      const aisleCenter = (eZoneX + zoneWidth + fZoneX) / 2;
      
      // Position E6 on the left, F6 on the right
      const offset = bin.id === 'E-06-01' ? -15 : 15;
      
      return {
        x: aisleCenter + offset,
        y: 60 // At the top
      };
    }
    
    // Special positioning for G6 and H6 - between zones G and H at the top
    if (bin.id === 'G-06-01' || bin.id === 'H-06-01') { // G-06-01 is G6, H-06-01 is H6
      const gZoneX = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap;
      const hZoneX = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
      const aisleCenter = (gZoneX + zoneWidth + hZoneX) / 2;
      
      // Position G6 on the left, H6 on the right
      const offset = bin.id === 'G-06-01' ? -15 : 15;
      
      return {
        x: aisleCenter + offset,
        y: 60 // At the top
      };
    }
    
    // Skip E6, F6, G6, H6 in regular zone layouts as they were already handled above
    if (bin.id === 'E-06-01' || bin.id === 'F-06-01' || bin.id === 'G-06-01' || bin.id === 'H-06-01' || bin.id === 'C-06-01') {
      return { x: -1000, y: -1000 }; // Already positioned, hide from regular layout
    }
    
    // Get all bins in this zone and sort them, excluding special bins that have custom positioning
    const zoneBins = binData.filter(b => 
      b.zone === bin.zone && 
      b.id !== 'C-06-01' && 
      b.id !== 'E-06-01' && 
      b.id !== 'F-06-01' && 
      b.id !== 'G-06-01' && 
      b.id !== 'H-06-01'
    )
      .sort((a, b) => {
        const rowDiff = parseInt(a.row) - parseInt(b.row);
        if (rowDiff !== 0) return rowDiff;
        return parseInt(b.shelf) - parseInt(a.shelf);
      });
    
    // Debug logging
    if (bin.zone === 'A' && bin.row === '01') {
    }
    
    // Find this bin's position in the sorted list
    const binIndex = zoneBins.findIndex(b => b.id === bin.id);
    
    // Arrange bins vertically, with proper spacing
    const binSpacingY = 36; // Vertical spacing between bins
    const startOffset = 25; // Offset from zone top
    
    // For zones with many bins, use tighter spacing or multiple columns
    if (zoneBins.length > 7) {
      // Two column layout for zones with many bins
      const column = Math.floor(binIndex / 7);
      const rowInColumn = binIndex % 7;
      const columnSpacing = 35; // Space between columns
      const totalColumnsWidth = columnSpacing; // Total width needed for 2 columns
      const columnOffset = column * columnSpacing - (totalColumnsWidth / 2); // Center both columns
      
      // Reverse the visual order so bin 5 is at top and bin 1 is at bottom
      const reversedRowInColumn = 6 - rowInColumn; // Reverse within the column
      
      return {
        x: zoneCenter + columnOffset, // Center the columns within the zone
        y: baseY + startOffset + reversedRowInColumn * binSpacingY
      };
    } else {
      // Single column layout with adjusted spacing
      // For zones with exactly 5 bins, make them fill the entire vertical space
      const zoneHeight = 300; // Standard zone height
      const availableHeight = zoneHeight - startOffset - 30; // Leave some padding at bottom
      
      if (zoneBins.length === 5) {
        // Distribute 5 bins evenly across the full zone height
        const evenSpacing = availableHeight / 4; // 4 gaps between 5 bins
        // Reverse the visual order so bin 5 is at top and bin 1 is at bottom
        const reversedIndex = (zoneBins.length - 1) - binIndex;
        return {
          x: zoneCenter,
          y: baseY + startOffset + reversedIndex * evenSpacing
        };
      } else {
        // For other zones, use normal spacing
        const effectiveSpacing = Math.min(binSpacingY, Math.floor(240 / zoneBins.length));
        // Reverse the visual order so bin 5 is at top and bin 1 is at bottom
        const reversedIndex = (zoneBins.length - 1) - binIndex;
        return {
          x: zoneCenter,
          y: baseY + startOffset + reversedIndex * effectiveSpacing
        };
      }
    }
  };

  // Memoized max value calculation for performance
  const maxValueForHeatmap = useMemo(() => {
    return Math.max(...binData.map(b => getBinMetrics(b).value));
  }, [binData, getBinMetrics]);

  // Optimized bin color calculation with memoization
  const getBinColor = useCallback((bin) => {
    const metrics = getBinMetrics(bin);
    
    if (heatmapMode === 'utilization') {
      // Color based on capacity utilization
      const util = metrics.utilization;
      if (util === 0) return '#1f2937'; // gray-800 - empty
      if (util < 20) return '#312e81'; // indigo-900
      if (util < 40) return '#4c1d95'; // purple-900
      if (util < 60) return '#581c87'; // purple-900
      if (util < 80) return '#9333ea'; // purple-600
      return '#dc2626'; // red-600 - hot spot
    } else if (heatmapMode === 'movement') {
      // Color based on movement frequency
      const movement = metrics.movementScore;
      if (movement === 0) return '#1f2937'; // gray-800 - no movement
      if (movement < 20) return '#164e63'; // cyan-900
      if (movement < 40) return '#1e40af'; // blue-800
      if (movement < 60) return '#2563eb'; // blue-600
      if (movement < 80) return '#f59e0b'; // amber-500
      return '#ef4444'; // red-500 - high movement
    } else if (heatmapMode === 'value') {
      // Color based on total value
      const valuePercent = (metrics.value / maxValueForHeatmap) * 100;
      
      if (valuePercent === 0) return '#1f2937'; // gray-800
      if (valuePercent < 20) return '#14532d'; // green-900
      if (valuePercent < 40) return '#166534'; // green-800
      if (valuePercent < 60) return '#15803d'; // green-700
      if (valuePercent < 80) return '#16a34a'; // green-600
      return '#22c55e'; // green-500 - highest value
    }
    
    // Default fallback
    return '#374151';
  }, [getBinMetrics, heatmapMode, maxValueForHeatmap]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Warehouse Map with Epic 3D Effects */}
      <div className="lg:col-span-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          whileHover={{ scale: 1.01 }}
          className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden"
          style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.2) 0%, transparent 50%)",
                "radial-gradient(circle at 100% 0%, rgba(147,51,234,0.2) 0%, transparent 50%)",
                "radial-gradient(circle at 100% 100%, rgba(34,197,94,0.2) 0%, transparent 50%)",
                "radial-gradient(circle at 0% 100%, rgba(239,68,68,0.2) 0%, transparent 50%)",
                "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.2) 0%, transparent 50%)",
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          {/* Heatmap Controls */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Warehouse Heatmap</h3>
            <div className="flex items-center gap-4">
              <div className="flex bg-white/[0.05] rounded-xl p-1">
                {[
                  { value: 'utilization', label: 'Utilization', icon: '📊', color: 'blue' },
                  { value: 'movement', label: 'Movement', icon: '🔄', color: 'purple' },
                  { value: 'value', label: 'Value', icon: '💰', color: 'green' }
                ].map((mode) => (
                  <motion.button
                    key={mode.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setHeatmapMode(mode.value);
                      playSound('click');
                    }}
                    className={`relative px-3 py-1.5 rounded-lg transition-all duration-300 flex items-center gap-1 overflow-hidden ${
                      heatmapMode === mode.value
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {/* Sweep effect on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    
                    {/* Active mode glow */}
                    {heatmapMode === mode.value && (
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r from-${mode.color}-500/20 to-${mode.color}-600/20 rounded-lg`}
                        animate={{
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    
                    <motion.span 
                      className="text-sm relative z-10"
                      animate={heatmapMode === mode.value ? { rotate: [0, 10, -10, 0] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {mode.icon}
                    </motion.span>
                    <span className="text-sm relative z-10">{mode.label}</span>
                  </motion.button>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHeatmapLegend(!showHeatmapLegend)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Info size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setTransferMode(!transferMode);
                  setSourceBin(null);
                  setTargetBin(null);
                  playSound('click');
                }}
                className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 overflow-hidden ${
                  transferMode
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40'
                    : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1] border border-white/10'
                }`}
                style={{ zIndex: 10 }}
              >
                {/* Animated background effect for active state */}
                {transferMode && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: [-100, 100] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: '200%' }}
                  />
                )}
                <motion.div
                  animate={{ rotate: transferMode ? 360 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <TrendingUp size={18} />
                </motion.div>
                <span className="relative z-10">{transferMode ? 'Exit Transfer' : 'Transfer Mode'}</span>
              </motion.button>
            </div>
          </div>
          
          {/* Transfer mode indicator */}
          <AnimatePresence>
            {transferMode && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center"
              >
                <p className="text-green-400 text-sm font-medium">
                  {!sourceBin ? (
                    <>📦 Click a bin to select source</>
                  ) : (
                    <>✅ Source: {sourceBin?.id} → Click target bin to transfer</>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.svg 
            className="w-full relative z-10" 
            viewBox="0 -50 1100 850" 
            style={{ maxHeight: '850px', overflow: 'visible' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Animated grid background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <motion.line
                  x1="0" y1="0" x2="40" y2="0"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                  animate={{ opacity: [0.05, 0.1, 0.05] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.line
                  x1="0" y1="0" x2="0" y2="40"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                  animate={{ opacity: [0.05, 0.1, 0.05] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                />
              </pattern>
              
              {/* Glow filters for epic effects */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <filter id="epicGlow">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <linearGradient id="transferGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              
              <filter id="transferGlow">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Grid background */}
            <rect width="1100" height="800" fill="url(#grid)" opacity="0.5" />
            {/* Zone background extensions - drawn first so they appear behind everything */}
            {zones.map((zone) => {
              let x = 0;
              let specialBinX = 0;
              const zoneWidth = 80;
              const closeGap = 10;
              const aisleGap = 60;
              const zoneTopY = 30; // Top of zone rectangles  
              const specialBinY = 48; // Just below special bins
              
              switch(zone) {
                case 'C':
                  x = 10 + zoneWidth + aisleGap + zoneWidth + closeGap;
                  // C6 is centered between C and D
                  const cZoneX = 10 + zoneWidth + aisleGap + zoneWidth + closeGap;
                  const dZoneX = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
                  specialBinX = (cZoneX + zoneWidth + dZoneX) / 2;
                  break;
                case 'E':
                  x = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap;
                  // E6 is in aisle between E and F, on the left
                  const eZoneX = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap;
                  const fZoneX = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
                  specialBinX = (eZoneX + zoneWidth + fZoneX) / 2 - 15;
                  break;
                case 'F':
                  x = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
                  // F6 is in aisle between E and F, on the right
                  const eZoneX2 = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap;
                  const fZoneX2 = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
                  specialBinX = (eZoneX2 + zoneWidth + fZoneX2) / 2 + 15;
                  break;
                case 'G':
                  x = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap;
                  // G6 is in aisle between G and H, on the left
                  const gZoneX = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap;
                  const hZoneX = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
                  specialBinX = (gZoneX + zoneWidth + hZoneX) / 2 - 15;
                  break;
                case 'H':
                  x = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
                  // H6 is in aisle between G and H, on the right
                  const gZoneX2 = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap;
                  const hZoneX2 = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
                  specialBinX = (gZoneX2 + zoneWidth + hZoneX2) / 2 + 15;
                  break;
              }
              
              // Check if zone has special bin
              const hasSpecialBin = ['C', 'E', 'F', 'G', 'H'].includes(zone);
              if (hasSpecialBin && zone !== 'I') {
                // Draw a background extension from zone to special bin
                return (
                  <g key={`${zone}-extension`}>
                    {/* Zone extension branch */}
                    <path
                      d={`
                        M ${x} ${zoneTopY}
                        L ${x + zoneWidth} ${zoneTopY}
                        L ${x + zoneWidth} ${zoneTopY + 10}
                        L ${specialBinX + 20} ${zoneTopY + 10}
                        L ${specialBinX + 20} ${specialBinY}
                        L ${specialBinX - 20} ${specialBinY}
                        L ${specialBinX - 20} ${zoneTopY + 10}
                        L ${x} ${zoneTopY + 10}
                        Z
                      `}
                      fill="#1f2937"
                      stroke="#374151"
                      strokeWidth="2"
                    />
                  </g>
                );
              }
              return null;
            })}
            
            {/* Zone backgrounds */}
            {zones.map((zone) => {
              let row = 0;
              let x = 0;
              const zoneWidth = 80;
              const closeGap = 10;
              const aisleGap = 60;
              
              // Custom positioning for each zone - same logic as bins
              switch(zone) {
                case 'A':
                  x = 10;
                  break;
                case 'B':
                  x = 10 + zoneWidth + aisleGap;
                  break;
                case 'C':
                  x = 10 + zoneWidth + aisleGap + zoneWidth + closeGap;
                  // has C6
                  break;
                case 'D':
                  x = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
                  break;
                case 'E':
                  x = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap;
                  // has E6
                  break;
                case 'F':
                  x = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
                  // has F6
                  break;
                case 'G':
                  x = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap;
                  // has G6
                  break;
                case 'H':
                  x = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
                  // has H6
                  break;
                case 'OUT':
                  // Position OUT zone between H and I vertically
                  row = 0.5;
                  x = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
                  break;
                case 'I':
                  row = 1;
                  x = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap;
                  break;
                case 'SMT':
                  row = 1;
                  x = 10; // Start at Zone A position
                  break;
                case 'PRODUCTION':
                  row = 1;
                  x = 10 + zoneWidth + aisleGap + zoneWidth + closeGap; // Start at Zone C position
                  break;
                case 'ASSEMBLY':
                  row = 1;
                  // Position ASSEMBLY at the very right of PRODUCTION zone
                  const gZoneEndRender = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap + zoneWidth;
                  const h6PositionRender = gZoneEndRender + (aisleGap / 2);
                  const assemblyWidthRender = (zoneWidth + closeGap + zoneWidth) / 2 + 20;
                  x = h6PositionRender - assemblyWidthRender;
                  break;
              }
              
              let y = row * 450 + 30; // Increased gap between rows
              let currentZoneWidth = zoneWidth;
              // Calculate zone height based on number of bins
              const zoneBinCount = binData.filter(b => 
                b.zone === zone && 
                b.id !== 'C-06-01' && 
                b.id !== 'E-06-01' && 
                b.id !== 'F-06-01' && 
                b.id !== 'G-06-01' && 
                b.id !== 'H-06-01'
              ).length;
              
              // Fixed zone height for consistency
              let currentZoneHeight = 300; // Standard height for all zones
              
              // Calculate specific widths and heights for special zones
              if (zone === 'SMT') {
                // SMT spans from Zone A to Zone B (including the aisle between)
                currentZoneWidth = zoneWidth + aisleGap + zoneWidth;
              } else if (zone === 'OUT') {
                // OUT zone represents warehouse gate - wider and shorter
                currentZoneWidth = zoneWidth * 1.5;
                currentZoneHeight = 80;
                // Calculate perfect center between Zone H bottom and Zone I top
                const zoneHBottom = 30 + 300; // Row 0: y=30, height=300
                const zoneITop = 480; // Row 1: y=480
                const gapCenter = (zoneHBottom + zoneITop) / 2;
                y = gapCenter - (currentZoneHeight / 2); // Center the OUT zone in the gap
              } else if (zone === 'PRODUCTION') {
                // PRODUCTION spans from Zone C to H6 (between G and H)
                // C + gap + D + close + E + gap + F + close + G + partial gap to H6
                const gZoneEnd = 10 + zoneWidth + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + (zoneWidth * 2) + closeGap + aisleGap + zoneWidth + closeGap + zoneWidth;
                const h6Position = gZoneEnd + (aisleGap / 2); // H6 is in the middle of the aisle between G and H
                const productionStart = 10 + zoneWidth + aisleGap + zoneWidth + closeGap; // Zone C start
                currentZoneWidth = h6Position - productionStart;
              } else if (zone === 'ASSEMBLY') {
                // ASSEMBLY is half the size - spans roughly from Zone F to mid-G
                // Assembly zone positioning
                // Half the original width
                currentZoneWidth = (zoneWidth + closeGap + zoneWidth) / 2 + 20; // Roughly 1.5 zones wide
                // 30% shorter height
                currentZoneHeight = 300 * 0.7; // 210 pixels
                // Center vertically within the PRODUCTION zone
                y = y + (300 - currentZoneHeight) / 2; // Offset to center within 300px height
              }
              
              return (
                <g 
                  key={zone}
                  onClick={() => {
                    if (zone === 'OUT' && transferMode) {
                      // Easter egg: clicking OUT exits transfer mode
                      setTransferMode(false);
                      setSourceBin(null);
                      setTargetBin(null);
                      playSound('success');
                      // Show a fun achievement
                      dispatch({ type: 'SHOW_ACHIEVEMENT', achievement: { name: 'Exit Strategy!', xp: 10 } });
                    }
                  }}
                  style={{ cursor: zone === 'OUT' && transferMode ? 'pointer' : 'default' }}
                >
                  <rect
                    x={x}
                    y={y}
                    width={currentZoneWidth}
                    height={currentZoneHeight}
                    fill={zone === 'OUT' ? "#065f46" : zone === 'ASSEMBLY' ? "#2d3748" : "#1f2937"}
                    stroke={zone === 'OUT' ? "#10b981" : zone === 'ASSEMBLY' ? "#4a5568" : "#374151"}
                    strokeWidth={zone === 'OUT' ? "3" : "2"}
                    rx="8"
                    opacity={zone === 'ASSEMBLY' ? 0.8 : 1}
                  />
                  <text
                    x={x + currentZoneWidth / 2}
                    y={zone === 'ASSEMBLY' ? y + currentZoneHeight / 2 + 5 : zone === 'OUT' ? y + currentZoneHeight / 2 + 5 : y - 10}
                    textAnchor="middle"
                    className={`fill-white ${zone === 'OUT' ? 'text-lg' : 'text-sm'} font-bold pointer-events-none`}
                  >
                    {zone === 'OUT' ? '🚪 OUT' : zone.length > 1 ? zone : `Zone ${zone}`}
                  </text>
                  {/* Add subtle hover effect for OUT zone in transfer mode */}
                  {zone === 'OUT' && transferMode && (
                    <motion.rect
                      x={x}
                      y={y}
                      width={currentZoneWidth}
                      height={currentZoneHeight}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      rx="8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                </g>
              );
            })}
            
            {/* Connection line in transfer mode - for hovering */}
            {transferMode && sourceBin && hoveredBin && sourceBin?.id !== hoveredBin && !targetBin && (
              <>
                {/* Glow effect for the line */}
                <motion.line
                  x1={getSafeBinPosition(sourceBin?.id).x}
                  y1={getSafeBinPosition(sourceBin?.id).y}
                  x2={getSafeBinPosition(hoveredBin).x}
                  y2={getSafeBinPosition(hoveredBin).y}
                  stroke="#10b981"
                  strokeWidth="6"
                  opacity="0.3"
                  filter="url(#transferGlow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3 }}
                />
                {/* Main line */}
                <motion.line
                  x1={getSafeBinPosition(sourceBin?.id).x}
                  y1={getSafeBinPosition(sourceBin?.id).y}
                  x2={getSafeBinPosition(hoveredBin).x}
                  y2={getSafeBinPosition(hoveredBin).y}
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                {/* Animated dash */}
                <motion.line
                  x1={getSafeBinPosition(sourceBin?.id).x}
                  y1={getSafeBinPosition(sourceBin?.id).y}
                  x2={getSafeBinPosition(hoveredBin).x}
                  y2={getSafeBinPosition(hoveredBin).y}
                  stroke="#34d399"
                  strokeWidth="2"
                  strokeDasharray="20 180"
                  strokeDashoffset="0"
                  opacity="0.8"
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: -200 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </>
            )}
            
            {/* Connection line in transfer mode - for selected source and target */}
            {transferMode && sourceBin && targetBin && (
              <>
                {/* Glow effect for the line */}
                <motion.line
                  x1={getSafeBinPosition(sourceBin?.id).x}
                  y1={getSafeBinPosition(sourceBin?.id).y}
                  x2={getSafeBinPosition(targetBin?.id).x}
                  y2={getSafeBinPosition(targetBin?.id).y}
                  stroke="#3b82f6"
                  strokeWidth="8"
                  opacity="0.4"
                  filter="url(#transferGlow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                />
                {/* Main line */}
                <motion.line
                  x1={getSafeBinPosition(sourceBin?.id).x}
                  y1={getSafeBinPosition(sourceBin?.id).y}
                  x2={getSafeBinPosition(targetBin?.id).x}
                  y2={getSafeBinPosition(targetBin?.id).y}
                  stroke="url(#transferGradient)"
                  strokeWidth="4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
                {/* Animated particles along the line */}
                <motion.circle
                  r="3"
                  fill="#3b82f6"
                  filter="url(#transferGlow)"
                  initial={{
                    x: getSafeBinPosition(sourceBin?.id).x,
                    y: getSafeBinPosition(sourceBin?.id).y
                  }}
                  animate={{
                    x: getSafeBinPosition(targetBin?.id).x,
                    y: getSafeBinPosition(targetBin?.id).y
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </>
            )}
            
            {/* Epic 3D Bins with Animations */}
            {binData.map((bin, index) => {
              const pos = getBinPosition(bin);
              
              // Skip bins that don't have valid positions
              if (!pos || (pos.x === -1000 && pos.y === -1000)) {
                return null;
              }
              
              const isHovered = hoveredBin === bin.id;
              const isSelected = selectedBin?.id === bin.id;
              const metrics = getBinMetrics(bin);
              
              // Get bin number for display - use sequential numbering
              const zoneBins = binData.filter(b => b.zone === bin.zone)
                .sort((a, b) => {
                  const rowDiff = parseInt(a.row) - parseInt(b.row);
                  if (rowDiff !== 0) return rowDiff;
                  return parseInt(b.shelf) - parseInt(a.shelf);
                });
              const binNumber = zoneBins.findIndex(b => b.id === bin.id) + 1;
              
              return (
                <motion.g
                  key={bin.id}
                  data-bin-id={bin.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    transition: { 
                      delay: index * 0.02,
                      type: "spring",
                      stiffness: 260,
                      damping: 20
                    }
                  }}
                  onHoverStart={() => onBinHover(bin.id)}
                  onHoverEnd={() => onBinHover(null)}
                  onClick={() => {
                    if (transferMode) {
                      // In transfer mode
                      if (!sourceBin) {
                        // Select source bin
                        setSourceBin(bin);
                        playSound('click');
                        toast.success(`Source bin selected: ${bin.zone}${binData.filter(b => b.zone === bin.zone).sort((a, b) => {
                          const rowDiff = parseInt(a.row) - parseInt(b.row);
                          if (rowDiff !== 0) return rowDiff;
                          return parseInt(b.shelf) - parseInt(a.shelf);
                        }).findIndex(b => b.id === bin.id) + 1}`);
                      } else if (bin.id !== sourceBin?.id) {
                        // Select target bin
                        setTargetBin(bin);
                        setSelectedTransferZone(bin.zone);
                        setSelectedTransferBin(bin.id);
                        playSound('success');
                        toast.success(`Target bin selected: ${bin.zone}${binData.filter(b => b.zone === bin.zone).sort((a, b) => {
                          const rowDiff = parseInt(a.row) - parseInt(b.row);
                          if (rowDiff !== 0) return rowDiff;
                          return parseInt(b.shelf) - parseInt(a.shelf);
                        }).findIndex(b => b.id === bin.id) + 1}`);
                      } else {
                        // Clicking source bin again - deselect
                        setSourceBin(null);
                        setTargetBin(null);
                        setSelectedTransferZone('');
                        setSelectedTransferBin('');
                        playSound('click');
                        toast.info('Source bin deselected');
                      }
                    } else {
                      // Normal mode
                      onBinClick(bin);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* 3D Shadow effect */}
                  <motion.ellipse
                    cx={pos.x}
                    cy={pos.y + 18}
                    rx="20"
                    ry="6"
                    fill="rgba(0,0,0,0.2)"
                    animate={isHovered ? { scale: 1.3, opacity: 0.4 } : { scale: 1, opacity: 0.2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                  
                  {/* Enhanced effects for transfer mode */}
                  {transferMode && sourceBin?.id === bin.id && (
                    <>
                      <rect
                        x={pos.x - 24}
                        y={pos.y - 19}
                        width={48}
                        height={38}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        rx="6"
                        className="animate-pulse"
                        filter="url(#epicGlow)"
                      />
                      <motion.rect
                        x={pos.x - 18}
                        y={pos.y - 18}
                        width={36}
                        height={36}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        rx="6"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.3, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      {/* Particle effect for selected source */}
                      {[...Array(3)].map((_, i) => (
                        <motion.circle
                          key={i}
                          cx={pos.x}
                          cy={pos.y}
                          r="2"
                          fill="#10b981"
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{
                            scale: [0, 1, 0],
                            opacity: [1, 0.5, 0],
                            x: [0, Math.random() * 40 - 20],
                            y: [0, Math.random() * 40 - 20]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.6
                          }}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* Enhanced effects for transfer mode - target bin */}
                  {transferMode && targetBin?.id === bin.id && (
                    <>
                      <rect
                        x={pos.x - 24}
                        y={pos.y - 19}
                        width={48}
                        height={38}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        rx="6"
                        className="animate-pulse"
                        filter="url(#epicGlow)"
                      />
                      <motion.rect
                        x={pos.x - 18}
                        y={pos.y - 18}
                        width={36}
                        height={36}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        rx="6"
                        strokeDasharray="4 2"
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: -6 }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                      />
                    </>
                  )}
                  
                  {/* Main bin with 3D effect */}
                  <motion.rect
                    x={pos.x - 20}
                    y={pos.y - 15}
                    width={40}
                    height={30}
                    fill={getBinColor(bin)}
                    stroke={
                      transferMode && sourceBin?.id === bin.id ? '#10b981' :
                      transferMode && targetBin?.id === bin.id ? '#3b82f6' :
                      isSelected ? '#8b5cf6' : 
                      isHovered ? '#3b82f6' : 
                      '#4b5563'
                    }
                    strokeWidth={
                      transferMode && sourceBin?.id === bin.id ? '3' :
                      transferMode && targetBin?.id === bin.id ? '3' :
                      isSelected ? '3' : 
                      isHovered ? '2' : 
                      '1'
                    }
                    rx="4"
                    filter={isHovered || isSelected ? "url(#glow)" : ""}
                    animate={{
                      transform: isHovered ? 'translateY(-2px)' : 'translateY(0px)'
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                  
                  {/* 3D top face for depth effect */}
                  {(isHovered || isSelected) && (
                    <motion.path
                      d={`M ${pos.x - 20} ${pos.y - 15} L ${pos.x - 16} ${pos.y - 20} L ${pos.x + 16} ${pos.y - 20} L ${pos.x + 20} ${pos.y - 15} Z`}
                      fill={getBinColor(bin)}
                      fillOpacity="0.8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  
                  {/* Utilization indicator bar */}
                  <motion.rect
                    x={pos.x - 10}
                    y={pos.y + 8}
                    width={20}
                    height={2}
                    fill="rgba(255,255,255,0.2)"
                    rx="1"
                  />
                  <motion.rect
                    x={pos.x - 10}
                    y={pos.y + 8}
                    width={20 * (metrics.utilization / 100)}
                    height={2}
                    fill={metrics.utilization > 80 ? '#ef4444' : metrics.utilization > 50 ? '#f59e0b' : '#10b981'}
                    rx="1"
                    initial={{ width: 0 }}
                    animate={{ width: 20 * (metrics.utilization / 100) }}
                    transition={{ delay: index * 0.02 + 0.5, duration: 0.5 }}
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white text-xs font-medium pointer-events-none"
                    style={{ fontSize: '10px' }}
                  >
                    {/* Special labels for bins in aisles */}
                    {bin.id === 'C-06-01' ? 'C6' : 
                     bin.id === 'E-06-01' ? 'E6' : 
                     bin.id === 'F-06-01' ? 'F6' : 
                     bin.id === 'G-06-01' ? 'G6' : 
                     bin.id === 'H-06-01' ? 'H6' : 
                     `${bin.zone}${binNumber}`}
                  </text>
                  
                </motion.g>
              );
            })}
            
            {/* Tooltip Layer - Render all tooltips on top */}
            {binData.map((bin) => {
              const pos = getBinPosition(bin);
              if (!pos || (pos.x === -1000 && pos.y === -1000)) {
                return null;
              }
              
              const isHovered = hoveredBin === bin.id;
              const metrics = getBinMetrics(bin);
              
              // Determine tooltip position based on multiple factors
              let tooltipOnLeft = pos.x > 500; // Lower threshold for middle zones
              
              // In transfer mode, position tooltip to avoid covering lines
              if (transferMode && sourceBin) {
                const sourcePos = getSafeBinPosition(sourceBin?.id);
                if (sourcePos) {
                  // If source is to the right, put tooltip on left
                  if (sourcePos.x > pos.x) {
                    tooltipOnLeft = true;
                  }
                  // If source is to the left, put tooltip on right
                  else if (sourcePos.x < pos.x) {
                    tooltipOnLeft = false;
                  }
                  // If source is roughly same X position, use Y position
                  else if (Math.abs(sourcePos.x - pos.x) < 50) {
                    tooltipOnLeft = sourcePos.y < pos.y;
                  }
                }
              }
              
              // For Zone F and similar middle zones, show tooltip below in transfer mode
              const showBelow = transferMode && sourceBin && 
                              (bin.zone === 'F' || bin.zone === 'E' || bin.zone === 'G') && 
                              pos.y < 150;
              
              const tooltipX = showBelow ? pos.x - 90 : (tooltipOnLeft ? pos.x - 195 : pos.x + 25);
              const tooltipY = showBelow ? pos.y + 35 : pos.y - 60;
              const arrowX = tooltipOnLeft && !showBelow ? pos.x - 20 : pos.x + 25;
              
              return (
                <AnimatePresence key={`tooltip-${bin.id}`}>
                  {isHovered && (
                    <motion.g
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      {/* Tooltip shadow */}
                      <rect
                        x={tooltipX + 2}
                        y={tooltipY + 2}
                        width={180}
                        height={80}
                        fill="rgba(0, 0, 0, 0.3)"
                        rx="6"
                        filter="url(#glow)"
                      />
                      
                      {/* Tooltip background with gradient */}
                      <defs>
                        <linearGradient id={`tooltipGradient-${bin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgba(17, 24, 39, 0.98)" />
                          <stop offset="100%" stopColor="rgba(31, 41, 55, 0.98)" />
                        </linearGradient>
                      </defs>
                      
                      <rect
                        x={tooltipX}
                        y={tooltipY}
                        width={180}
                        height={80}
                        fill={`url(#tooltipGradient-${bin.id})`}
                        stroke="rgba(59, 130, 246, 0.3)"
                        strokeWidth="1"
                        rx="6"
                      />
                      
                      {/* Animated border glow */}
                      <motion.rect
                        x={tooltipX}
                        y={tooltipY}
                        width={180}
                        height={80}
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.5)"
                        strokeWidth="2"
                        rx="6"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      
                      {/* Content with icons */}
                      <text x={tooltipX + 10} y={tooltipY + 20} className="fill-white text-xs font-bold">
                        📦 Bin {bin.id}
                      </text>
                      
                      {/* Utilization with progress bar */}
                      <text x={tooltipX + 10} y={tooltipY + 35} className="fill-gray-300 text-xs">
                        📊 Utilization:
                      </text>
                      <rect x={tooltipX + 75} y={tooltipY + 28} width={80} height={4} fill="rgba(255,255,255,0.1)" rx="2" />
                      <motion.rect
                        x={tooltipX + 75}
                        y={tooltipY + 28}
                        width={80 * (metrics.utilization / 100)}
                        height={4}
                        fill={metrics.utilization > 80 ? '#ef4444' : metrics.utilization > 50 ? '#f59e0b' : '#10b981'}
                        rx="2"
                        initial={{ width: 0 }}
                        animate={{ width: 80 * (metrics.utilization / 100) }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      />
                      <text x={tooltipX + 160} y={tooltipY + 35} className="fill-white text-xs font-semibold">
                        {Math.round(metrics.utilization)}%
                      </text>
                      
                      <text x={tooltipX + 10} y={tooltipY + 50} className="fill-gray-300 text-xs">
                        🔄 Movement: {Math.round(metrics.movementScore)}%
                      </text>
                      
                      <text x={tooltipX + 10} y={tooltipY + 65} className="fill-green-400 text-xs font-semibold">
                        💰 Value: ${metrics.value.toFixed(0)}
                      </text>
                      
                      {/* Tooltip arrow - points in different direction based on position */}
                      <path
                        d={showBelow
                          ? `M ${pos.x} ${tooltipY} L ${pos.x - 10} ${tooltipY - 10} L ${pos.x + 10} ${tooltipY - 10} Z`
                          : tooltipOnLeft 
                            ? `M ${arrowX} ${tooltipY + 80} L ${arrowX + 10} ${tooltipY + 70} L ${arrowX - 10} ${tooltipY + 70} Z`
                            : `M ${arrowX} ${tooltipY + 80} L ${arrowX - 10} ${tooltipY + 70} L ${arrowX + 10} ${tooltipY + 70} Z`
                        }
                        fill={`url(#tooltipGradient-${bin.id})`}
                        stroke="rgba(59, 130, 246, 0.3)"
                        strokeWidth="1"
                      />
                    </motion.g>
                  )}
                </AnimatePresence>
              );
            })}
            
          </motion.svg>
          
          {/* Heatmap Legend */}
          <AnimatePresence>
            {showHeatmapLegend && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="mt-4 bg-white/[0.03] rounded-xl p-4"
              >
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  {heatmapMode === 'utilization' && 'Bin Utilization Heatmap'}
                  {heatmapMode === 'movement' && 'Movement Frequency Heatmap'}
                  {heatmapMode === 'value' && 'Stock Value Heatmap'}
                </h4>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-400">Low</div>
                    {heatmapMode === 'utilization' && (
                      <div className="flex h-6 rounded overflow-hidden">
                        <div className="w-8 bg-gray-800"></div>
                        <div className="w-8 bg-indigo-900"></div>
                        <div className="w-8 bg-purple-900"></div>
                        <div className="w-8 bg-purple-900"></div>
                        <div className="w-8 bg-purple-600"></div>
                        <div className="w-8 bg-red-600"></div>
                      </div>
                    )}
                    {heatmapMode === 'movement' && (
                      <div className="flex h-6 rounded overflow-hidden">
                        <div className="w-8 bg-gray-800"></div>
                        <div className="w-8 bg-cyan-900"></div>
                        <div className="w-8 bg-blue-800"></div>
                        <div className="w-8 bg-blue-600"></div>
                        <div className="w-8 bg-amber-500"></div>
                        <div className="w-8 bg-red-500"></div>
                      </div>
                    )}
                    {heatmapMode === 'value' && (
                      <div className="flex h-6 rounded overflow-hidden">
                        <div className="w-8 bg-gray-800"></div>
                        <div className="w-8 bg-green-900"></div>
                        <div className="w-8 bg-green-800"></div>
                        <div className="w-8 bg-green-700"></div>
                        <div className="w-8 bg-green-600"></div>
                        <div className="w-8 bg-green-500"></div>
                      </div>
                    )}
                    <div className="text-xs text-gray-400">High</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {heatmapMode === 'utilization' && '0% - 100% capacity'}
                    {heatmapMode === 'movement' && 'Based on recent activity'}
                    {heatmapMode === 'value' && 'Total stock value'}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Bin Details Panel */}
      <div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            {transferMode && sourceBin ? (
              <div className="space-y-1">
                <span className="flex items-center gap-2">
                  <span className="text-green-400">From:</span> {sourceBin?.zone}{binData.filter(b => b.zone === sourceBin?.zone && sourceBin?.zone).sort((a, b) => {
                    const rowDiff = parseInt(a.row) - parseInt(b.row);
                    if (rowDiff !== 0) return rowDiff;
                    return parseInt(b.shelf) - parseInt(a.shelf);
                  }).findIndex(b => b.id === sourceBin?.id) + 1}
                </span>
                {targetBin && (
                  <span className="flex items-center gap-2">
                    <ArrowRight className="text-gray-400" size={16} />
                    <span className="text-blue-400">To:</span> {targetBin?.zone}{binData.filter(b => b.zone === targetBin?.zone && targetBin?.zone).sort((a, b) => {
                      const rowDiff = parseInt(a.row) - parseInt(b.row);
                      if (rowDiff !== 0) return rowDiff;
                      return parseInt(b.shelf) - parseInt(a.shelf);
                    }).findIndex(b => b.id === targetBin?.id) + 1}
                  </span>
                )}
              </div>
            ) : selectedBin ? (
              `Bin ${selectedBin?.id}`
            ) : (
              'Select a Bin'
            )}
          </h3>
          
          {(transferMode && sourceBin) || selectedBin ? (
            <div className="space-y-4">
              {/* Show transfer mode message */}
              {transferMode && sourceBin && !targetBin && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center"
                >
                  <p className="text-green-400 text-sm">
                    Click on any other bin to transfer stock
                  </p>
                </motion.div>
              )}
              
              {/* Show target bin selected message */}
              {transferMode && sourceBin && targetBin && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3"
                >
                  <p className="text-blue-400 text-sm mb-1">
                    Target bin selected: <span className="font-semibold">{targetBin?.zone}{binData.filter(b => b.zone === targetBin?.zone && targetBin?.zone).sort((a, b) => {
                      const rowDiff = parseInt(a.row) - parseInt(b.row);
                      if (rowDiff !== 0) return rowDiff;
                      return parseInt(b.shelf) - parseInt(a.shelf);
                    }).findIndex(b => b.id === targetBin?.id) + 1}</span>
                  </p>
                  <p className="text-gray-400 text-xs">
                    Use the transfer section below to complete the transfer
                  </p>
                </motion.div>
              )}
              
              {/* Bin Info */}
              <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                {(() => {
                  const displayBin = transferMode && sourceBin ? sourceBin : selectedBin;
                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white capitalize">{displayBin.type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Capacity:</span>
                        <span className="text-white">{displayBin.capacity} units</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Current Stock:</span>
                        <span className="text-white">
                          {displayBin.currentStock.reduce((sum, s) => sum + s.quantity, 0)} units
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Utilization:</span>
                        <span className="text-white">
                          {Math.round((displayBin.currentStock.reduce((sum, s) => sum + s.quantity, 0) / displayBin.capacity) * 100)}%
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* Stock Items in Bin */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Stock Items:</h4>
                <div className="space-y-2">
                  {(() => {
                    const displayBin = transferMode && sourceBin ? sourceBin : selectedBin;
                    return displayBin.currentStock.length > 0 ? (
                      displayBin.currentStock.map((stock, index) => {
                      const stockItem = stockItems.find(item => item.sku === stock.sku);
                      return (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => stockItem && onItemClick(stockItem)}
                          className="bg-white/[0.03] rounded-xl p-3 cursor-pointer hover:bg-white/[0.05] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <GameIcon 
                                iconType={getItemIconType(stockItem?.name || '', stock.sku)} 
                                size={32} 
                                tier={stockItem?.status === 'critical' ? 'rare' : stockItem?.status === 'low' ? 'uncommon' : 'normal'} 
                              />
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {stockItem?.name || stock.sku}
                                </p>
                                <p className="text-xs text-gray-400">{stock.sku}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono text-white">{stock.quantity}</p>
                              <p className="text-xs text-gray-400">units</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-4">No items in this bin</p>
                  );
                })()}
                </div>
              </div>
              
              {/* Actions - hide in transfer mode */}
              {!transferMode && (
              <div className="pt-4 space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Add Stock to Bin</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowTransferSection(!showTransferSection);
                    setSelectedTransferStock(null);
                    setTransferQuantity(1);
                    setSelectedTransferZone('');
                    setSelectedTransferBin('');
                    playSound('click');
                  }}
                  className="w-full py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <TrendingUp size={18} />
                  <span>{showTransferSection ? 'Hide Transfer' : 'Transfer Stock'}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowBinAuditModal(true);
                    playSound('click');
                  }}
                  className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <Shield size={18} />
                  <span>Audit Bin</span>
                </motion.button>
              </div>
              )}
              
              {/* Transfer Section - Integrated below actions */}
              <AnimatePresence>
                {((showTransferSection && selectedBin) || (transferMode && sourceBin && targetBin)) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-white/10"
                  >
                    <h4 className="text-sm font-semibold text-green-400 mb-3">Transfer Stock</h4>
                    
                    {/* Select Stock Item */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Select Item</label>
                        <select
                          value={selectedTransferStock?.sku || ''}
                          onChange={(e) => {
                            const currentBin = transferMode && sourceBin ? sourceBin : selectedBin;
                            const stock = currentBin.currentStock.find(s => s.sku === e.target.value);
                            setSelectedTransferStock(stock);
                            setTransferQuantity(1);
                          }}
                          className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-green-500/50 [&>option]:bg-gray-800 [&>option]:text-white"
                        >
                          <option value="" className="bg-gray-800">Choose item...</option>
                          {(transferMode && sourceBin ? sourceBin : selectedBin)?.currentStock?.map(stock => {
                            const item = stockItems.find(i => i.sku === stock.sku);
                            return (
                              <option key={stock.sku} value={stock.sku} className="bg-gray-800">
                                {item?.name || stock.sku} ({stock.quantity} units)
                              </option>
                            );
                          }) || []}
                        </select>
                      </div>
                      
                      {/* Quantity */}
                      {selectedTransferStock && (
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Quantity (Max: {selectedTransferStock.quantity})
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={selectedTransferStock.quantity}
                            value={transferQuantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                setTransferQuantity('');
                              } else {
                                const num = parseInt(value);
                                if (!isNaN(num)) {
                                  setTransferQuantity(Math.min(Math.max(1, num), selectedTransferStock.quantity));
                                }
                              }
                            }}
                            className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-green-500/50"
                          />
                        </div>
                      )}
                      
                      {/* Target Zone */}
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Target Zone</label>
                        <select
                          value={selectedTransferZone}
                          onChange={(e) => {
                            setSelectedTransferZone(e.target.value);
                            setSelectedTransferBin('');
                          }}
                          className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-green-500/50 [&>option]:bg-gray-800 [&>option]:text-white"
                        >
                          <option value="" className="bg-gray-800">Choose zone...</option>
                          {[...new Set(binData.filter(b => b.id !== selectedBin?.id).map(b => b.zone))].sort().map(zone => (
                            <option key={zone} value={zone} className="bg-gray-800">Zone {zone}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Target Bin */}
                      {selectedTransferZone && (
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Target Bin</label>
                          <select
                            value={selectedTransferBin}
                            onChange={(e) => setSelectedTransferBin(e.target.value)}
                            className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-green-500/50 [&>option]:bg-gray-800 [&>option]:text-white"
                          >
                            <option value="" className="bg-gray-800">Choose bin...</option>
                            {binData
                              .filter(b => b.zone === selectedTransferZone && b.id !== selectedBin?.id)
                              .map(bin => {
                                const zoneBins = binData.filter(b => b.zone === bin.zone)
                                  .sort((a, b) => {
                                    const rowDiff = parseInt(a.row) - parseInt(b.row);
                                    if (rowDiff !== 0) return rowDiff;
                                    return parseInt(b.shelf) - parseInt(a.shelf);
                                  });
                                const binNumber = zoneBins.findIndex(b => b.id === bin.id) + 1;
                                const binLabel = `${bin.zone}${binNumber}`;
                                const utilization = Math.round((bin.currentStock.reduce((sum, s) => sum + s.quantity, 0) / bin.capacity) * 100);
                                
                                return (
                                  <option key={bin.id} value={bin.id} className="bg-gray-800">
                                    {binLabel} ({utilization}% full)
                                  </option>
                                );
                              })}
                          </select>
                        </div>
                      )}
                      
                      {/* Transfer Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (!selectedTransferStock || !selectedTransferBin || !transferQuantity || transferQuantity <= 0) {
                            toast.error('Please fill all transfer fields');
                            return;
                          }
                          
                          // Execute transfer
                          const currentSourceBin = transferMode && sourceBin ? sourceBin : selectedBin;
                          const transferData = {
                            sourceBin: currentSourceBin?.id,
                            targetBin: selectedTransferBin,
                            sku: selectedTransferStock.sku,
                            quantity: parseInt(transferQuantity) || 0,
                            timestamp: new Date()
                          };
                          
                          // Use the same transfer logic from modal
                          const updatedSourceStock = currentSourceBin.currentStock.map(stock => {
                            if (stock.sku === transferData.sku) {
                              return {
                                ...stock,
                                quantity: stock.quantity - transferData.quantity,
                                lastUpdated: new Date().toISOString()
                              };
                            }
                            return stock;
                          }).filter(stock => stock.quantity > 0);
                          
                          const updatedSourceBin = {
                            ...currentSourceBin,
                            currentStock: updatedSourceStock,
                            stockInfo: updatedSourceStock.map(stock => {
                              const matchingItem = stockItems.find(item => item.sku === stock.sku);
                              return {
                                ...stock,
                                item: matchingItem,
                                name: matchingItem?.name || `Product ${stock.sku}`
                              };
                            })
                          };
                          
                          // Find and update target bin
                          const targetBinData = binData.find(b => b.id === transferData.targetBin);
                          const existingStock = targetBinData.currentStock.find(s => s.sku === transferData.sku);
                          
                          const updatedTargetStock = existingStock
                            ? targetBinData.currentStock.map(stock => {
                                if (stock.sku === transferData.sku) {
                                  return {
                                    ...stock,
                                    quantity: stock.quantity + transferData.quantity,
                                    lastUpdated: new Date().toISOString()
                                  };
                                }
                                return stock;
                              })
                            : [...targetBinData.currentStock, {
                                sku: transferData.sku,
                                quantity: transferData.quantity,
                                lastUpdated: new Date().toISOString()
                              }];
                          
                          const updatedTargetBin = {
                            ...targetBinData,
                            currentStock: updatedTargetStock,
                            stockInfo: updatedTargetStock.map(stock => {
                              const matchingItem = stockItems.find(item => item.sku === stock.sku);
                              return {
                                ...stock,
                                item: matchingItem,
                                name: matchingItem?.name || `Product ${stock.sku}`
                              };
                            })
                          };
                          
                          // Update bins
                          onBinUpdate(updatedSourceBin);
                          setTimeout(() => {
                            onBinUpdate(updatedTargetBin);
                          }, 100);
                          
                          // Update selected bin
                          onBinClick(updatedSourceBin);
                          
                          // Visual feedback
                          playSound('success');
                          const item = stockItems.find(i => i.sku === selectedTransferStock.sku);
                          toast.success(`Transferred ${transferQuantity} units of ${item?.name || selectedTransferStock.sku}`);
                          addXP(25, 'Stock Transfer');
                          
                          // Reset form
                          setSelectedTransferStock(null);
                          setTransferQuantity(1);
                          setSelectedTransferZone('');
                          setSelectedTransferBin('');
                          setShowTransferSection(false);
                        }}
                        disabled={!selectedTransferStock || !selectedTransferBin || transferQuantity <= 0}
                        className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <ArrowRight size={18} />
                        <span>Execute Transfer</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Click on a bin to view details</p>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Bin Audit Modal */}
      <AnimatePresence>
        {showBinAuditModal && selectedBin && (
          <BinAuditModal
            bin={selectedBin}
            binData={binData}
            stockItems={stockItems}
            onAudit={(auditData) => {
              // Process bin audit
              toast.success(`Bin ${selectedBin?.id} audit completed!`);
              playSound('success');
              addXP(50); // Award XP for completing bin audit
              
              // Update bin data with audit results
              const updatedBin = {
                ...selectedBin,
                lastAudit: new Date().toISOString(),
                auditResults: auditData
              };
              onBinUpdate(updatedBin);
              
              setShowBinAuditModal(false);
            }}
            onClose={() => setShowBinAuditModal(false)}
          />
        )}
      </AnimatePresence>
      
    </div>
  );
};

// Bin Audit Modal Component
const BinAuditModal = ({ bin, binData, stockItems, onAudit, onClose }) => {
  const [auditResults, setAuditResults] = useState({});
  const [notes, setNotes] = useState('');
  
  // Initialize audit results with current stock quantities
  useEffect(() => {
    const initialResults = {};
    bin.currentStock.forEach(stock => {
      initialResults[stock.sku] = {
        systemQuantity: stock.quantity,
        countedQuantity: stock.quantity.toString(), // Start with system quantity
        discrepancy: 0
      };
    });
    setAuditResults(initialResults);
  }, [bin]);
  
  const handleQuantityChange = (sku, value) => {
    const counted = parseInt(value) || 0;
    const system = auditResults[sku].systemQuantity;
    
    setAuditResults(prev => ({
      ...prev,
      [sku]: {
        ...prev[sku],
        countedQuantity: value,
        discrepancy: counted - system
      }
    }));
  };
  
  const getTotalDiscrepancy = () => {
    return Object.values(auditResults).reduce((sum, result) => {
      return sum + (result.discrepancy || 0);
    }, 0);
  };
  
  const handleSubmit = () => {
    const auditData = {
      timestamp: new Date().toISOString(),
      results: auditResults,
      notes,
      totalDiscrepancy: getTotalDiscrepancy()
    };
    
    onAudit(auditData);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield size={28} className="text-purple-400" />
              Bin Audit
            </h3>
            <p className="text-gray-400 mt-1">
              Bin {bin.zone}{binData.filter(b => b.zone === bin.zone).sort((a, b) => {
                const rowDiff = parseInt(a.row) - parseInt(b.row);
                if (rowDiff !== 0) return rowDiff;
                return parseInt(b.shelf) - parseInt(a.shelf);
              }).findIndex(b => b.id === bin.id) + 1} • {bin.currentStock.length} items
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-colors"
          >
            <X size={20} />
          </motion.button>
        </div>
        
        {/* Audit Table */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-6">
          {bin.currentStock.map(stock => {
            const item = stockItems.find(i => i.sku === stock.sku);
            const result = auditResults[stock.sku] || {};
            const discrepancy = result.discrepancy || 0;
            
            return (
              <motion.div
                key={stock.sku}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/[0.03] border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GameIcon 
                      iconType={item ? getItemIconType(item.name, item.sku) : 'package'} 
                      size={36} 
                    />
                    <div>
                      <p className="font-semibold text-white">{item?.name || stock.sku}</p>
                      <p className="text-sm text-gray-400">{stock.sku}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* System Quantity */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500">System</p>
                      <p className="text-lg font-semibold text-gray-300">{result.systemQuantity}</p>
                    </div>
                    
                    {/* Arrow */}
                    <ArrowRight size={20} className="text-gray-600" />
                    
                    {/* Counted Quantity */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Counted</p>
                      <input
                        type="number"
                        value={result.countedQuantity || ''}
                        onChange={(e) => handleQuantityChange(stock.sku, e.target.value)}
                        className="w-20 px-2 py-1 bg-white/[0.05] border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-purple-500/50"
                        min="0"
                      />
                    </div>
                    
                    {/* Discrepancy */}
                    <div className="text-center min-w-[80px]">
                      <p className="text-xs text-gray-500">Difference</p>
                      <p className={`text-lg font-semibold ${
                        discrepancy > 0 ? 'text-green-400' : 
                        discrepancy < 0 ? 'text-red-400' : 
                        'text-gray-400'
                      }`}>
                        {discrepancy > 0 ? '+' : ''}{discrepancy}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Audit Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any observations or issues found..."
            className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
            rows={3}
          />
        </div>
        
        {/* Summary and Actions */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm">
              <span className="text-gray-400">Total Discrepancy: </span>
              <span className={`font-semibold ${
                getTotalDiscrepancy() > 0 ? 'text-green-400' : 
                getTotalDiscrepancy() < 0 ? 'text-red-400' : 
                'text-gray-400'
              }`}>
                {getTotalDiscrepancy() > 0 ? '+' : ''}{getTotalDiscrepancy()} units
              </span>
            </div>
            {getTotalDiscrepancy() === 0 && (
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle size={20} />
                <span className="text-sm font-medium">Perfect Match!</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 rounded-xl font-medium transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
            >
              Complete Audit
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Epic Achievement Popup Component
const AchievementPopup = ({ achievement, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      exit={{ scale: 0, rotate: 180, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="fixed top-20 right-8 z-50"
    >
      <motion.div
        className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-6 rounded-3xl shadow-2xl shadow-purple-500/50 min-w-[300px]"
        animate={{
          boxShadow: [
            "0 0 40px rgba(245, 158, 11, 0.5)",
            "0 0 60px rgba(245, 158, 11, 0.8)",
            "0 0 40px rgba(245, 158, 11, 0.5)",
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Particle burst effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-300 rounded-full"
              initial={{ x: 0, y: 0, scale: 0 }}
              animate={{
                x: Math.cos(i * 30 * Math.PI / 180) * 100,
                y: Math.sin(i * 30 * Math.PI / 180) * 100,
                scale: [0, 1, 0],
                opacity: [1, 0]
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          ))}
        </div>
        
        {/* Trophy icon with animation */}
        <motion.div
          className="flex justify-center mb-4"
          animate={{
            rotate: [0, -10, 10, -10, 10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Trophy size={48} className="text-white drop-shadow-lg" />
        </motion.div>
        
        {/* Achievement text */}
        <motion.h3
          className="text-xl font-bold text-white text-center mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Achievement Unlocked!
        </motion.h3>
        
        <motion.p
          className="text-white/90 text-center font-medium"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {achievement.name}
        </motion.p>
        
        <motion.p
          className="text-white/70 text-sm text-center mt-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          +{achievement.xp} XP
        </motion.p>
        
        {/* Progress bar */}
        <motion.div
          className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 4.5 }}
        >
          <motion.div
            className="h-full bg-white/50"
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 4.5, ease: "linear" }}
          />
        </motion.div>
        
        {/* Close button */}
        <motion.button
          className="absolute top-2 right-2 text-white/70 hover:text-white"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
        >
          <X size={20} />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default StockControl;