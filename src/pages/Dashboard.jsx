import React, { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  TrendingUp, 
  Clock, 
  Award,
  Activity,
  Users,
  Truck,
  BarChart3,
  ChevronRight,
  Trophy,
  Star,
  Play,
  Presentation
} from 'lucide-react';
// Recharts imports removed - using optimized components
import { useWarehouse } from '../hooks/useWarehouseContext';
import AnimatedBackground from '../components/AnimatedBackground';
import GameIcon from '../components/GameIcon';
import AnimatedCounter from '../components/AnimatedCounter';
import ProgressRing from '../components/ProgressRing';
import { playSound, initializeAudio } from '../utils/audio';
import { useBatchedUpdates } from '../hooks/useBatchedUpdates';

// Lazy load heavy components
const OptimizedAreaChart = lazy(() => import('../components/dashboard/OptimizedAreaChart'));
const OptimizedPerformanceChart = lazy(() => import('../components/dashboard/OptimizedPerformanceChart'));

// Import data files
import ordersData from '../data/orders.json';
import binsData from '../data/bins.json';
import purchaseOrdersData from '../data/purchaseOrders.json';
import { initialTotes } from '../data/packingData';

// Enhanced Stats Card with GameIcon integration and modern animations - Memoized
const ModernStatsCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  onClick, 
  iconType = "box", 
  actualQuantity, 
  actionText = "Click to explore",
  color = "primary"
}) => {
  const colorClasses = useMemo(() => ({
    primary: "from-blue-500 to-blue-600",
    warning: "from-purple-500 to-purple-600", 
    success: "from-green-500 to-emerald-500",
    danger: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600",
    pink: "from-pink-500 to-pink-600"
  }), []);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  const handleHover = useCallback(async () => {
    try {
      await initializeAudio();
      await playSound('hover');
    } catch (error) {
      console.log('Audio error:', error);
    }
  }, []);

  return (
    <motion.div
      onClick={handleClick}
      onMouseEnter={handleHover}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl cursor-pointer relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10"
      whileHover={{ y: -8, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-6">
          <motion.div
            whileHover={{ scale: 1.1, rotateY: 15 }}
            transition={{ type: "spring", stiffness: 600, damping: 20 }}
          >
            <GameIcon
              iconType={iconType}
              actualQuantity={actualQuantity}
              size={60}
              iconSize="medium"
            />
          </motion.div>
        </div>
        
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        >
          <h3 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            <AnimatedCounter target={value} duration={1500} />
          </h3>
          <button 
            onClick={handleClick}
            className="text-gray-400 text-lg font-medium hover:text-blue-400 transition-colors duration-200 cursor-pointer"
          >
            {title}
          </button>
        </motion.div>
        
        {/* Interactive indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex items-center text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          <ChevronRight size={16} className="mr-2" />
          <span className="text-sm font-medium">{actionText}</span>
        </motion.div>
      </div>
    </motion.div>
  );
});

ModernStatsCard.displayName = 'ModernStatsCard';

// Tier calculation functions - Memoized
const getUserTier = (level) => {
  if (level >= 50) return 'cosmic';
  if (level >= 25) return 'mega';
  if (level >= 15) return 'super';
  if (level >= 8) return 'standard';
  return 'normal';
};

const getStatsTier = (value, trend = 0) => {
  const performanceScore = value + (trend * 2);
  if (performanceScore >= 40) return 'cosmic';
  if (performanceScore >= 25) return 'mega';
  if (performanceScore >= 15) return 'super';
  if (performanceScore >= 10) return 'standard';
  return 'normal';
};

// Main Dashboard Component
const Dashboard = () => {
  const { user, pickedOrders, packedOrders, availablePickingOrders } = useWarehouse();
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState('total'); // 'total', 'picked', 'packed'

  // Calculate real operational data
  const calculateStats = useCallback(() => {
    const orders = ordersData.orders;
    const bins = binsData.bins;
    const purchaseOrders = purchaseOrdersData.purchaseOrders;

    // Picking Station: Orders that need picking
    // Use context if it has been initialized (even if empty), otherwise use static data
    const contextInitialized = availablePickingOrders.length > 0 || pickedOrders.length > 0 || packedOrders.length > 0;
    const ordersToBePicked = contextInitialized
      ? availablePickingOrders 
      : orders.filter(order => order.status === 'pending' || order.status === 'picking');

    // Packing Station: Orders that need packing (from context)
    const ordersToBePacked = pickedOrders || [];

    // Shipping Station: Orders that have been packed (from context)
    const ordersShipped = packedOrders || [];

    // Inwards Station: Purchase orders awaiting receipt
    const purchaseOrdersToReceive = purchaseOrders.filter(po => 
      po.status === 'pending' || po.status === 'receiving'
    );

    // Stock Control: Number of bins with stock
    const binsWithStock = bins.filter(bin => bin.currentStock.length > 0).length;

    // Calculate total items picked (from picked orders in context)
    const totalItemsPicked = ordersToBePacked.reduce((total, order) => {
      return total + (order.items ? order.items.length : 0);
    }, 0);

    // Calculate total items packed (from packed orders in context)
    const totalItemsPacked = ordersShipped.reduce((total, order) => {
      return total + (order.items ? order.items.length : 0);
    }, 0);

    return {
      // Display values (order counts)
      todayOrders: ordersToBePicked.length,
      pendingOrders: ordersToBePacked.length, 
      activePickingTasks: ordersShipped.length,
      packingQueue: purchaseOrdersToReceive.length,
      teamPerformance: bins.length,
      
      // GameIcon quantities (matching display values for consistency)
      pickingQuantity: ordersToBePicked.length,
      packingQuantity: ordersToBePacked.length,
      shippingQuantity: ordersShipped.length,
      inwardsQuantity: purchaseOrdersToReceive.length,
      stockControlQuantity: binsWithStock,
      
      // Dispatch Performance metrics
      totalItemsPicked: totalItemsPicked,
      totalItemsPacked: totalItemsPacked
    };
  }, [availablePickingOrders, pickedOrders, packedOrders]);

  // Memoized stats calculation
  const stats = useMemo(() => {
    return calculateStats();
  }, [calculateStats]);

  // Initialize audio on component mount - optimized
  useEffect(() => {
    const handleFirstInteraction = async () => {
      await initializeAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const handleStatClick = useCallback(async (statType) => {
    try {
      await initializeAudio();
      await playSound('transition');
    } catch (error) {
      console.log('Audio error:', error);
    }
    
    // Navigate to appropriate page based on stat type
    switch (statType) {
      case 'todayOrders':
        navigate('/picking');
        break;
      case 'pendingOrders':
        navigate('/packing');
        break;
      case 'activePickingTasks':
        navigate('/shipping');
        break;
      case 'packingQueue':
        navigate('/inwards');
        break;
      case 'teamPerformance':
        navigate('/stock-control');
        break;
      default:
        break;
    }
  }, [navigate]);

  // Memoized metric change handler
  const handleMetricChange = useCallback((newMetric) => {
    setSelectedMetric(newMetric);
  }, []);

  return (
    <div className="w-full h-full min-h-[calc(100vh-8rem)] relative">
      <AnimatedBackground />
      
      <div className="relative z-10 space-y-8">
        {/* Dashboard Overview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotateY: 15 }}
                    transition={{ type: "spring", stiffness: 600, damping: 20 }}
                  >
                    <GameIcon
                      iconType="trophy"
                      actualQuantity={user?.level || 5}
                      size={64}
                      iconSize="large"
                    />
                  </motion.div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                    Welcome back, 
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={useCallback(async () => {
                        try {
                          await initializeAudio();
                          await playSound('click');
                        } catch (error) {
                          console.log('Audio error:', error);
                        }
                        navigate('/profile');
                      }, [navigate])}
                      onMouseEnter={useCallback(async () => {
                        try {
                          await initializeAudio();
                          await playSound('hover');
                        } catch (error) {
                          console.log('Audio error:', error);
                        }
                      }, [])}
                      className="ml-2 hover:text-blue-300 transition-colors cursor-pointer underline decoration-2 decoration-blue-500/50 hover:decoration-blue-500 underline-offset-4"
                    >
                      {user?.name}!
                    </motion.button>
                  </h1>
                </div>
                <p className="text-gray-400 text-xl">
                  Ready to make today productive? You're <span className="text-blue-400 font-bold">{100 - ((user?.xp / user?.xpToNextLevel) * 100).toFixed(0)}%</span> away from Level {user?.level + 1}!
                </p>
                
                {/* XP Progress Bar */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Level {user?.level} Progress</span>
                    <span className="text-sm text-blue-400 font-bold">{user?.xp} / {user?.xpToNextLevel} XP</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 relative shadow-md"
                      initial={{ width: 0 }}
                      animate={{ width: `${((user?.xp / user?.xpToNextLevel) * 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 opacity-50"
                        animate={{ 
                          opacity: [0.5, 0.8, 0.5],
                          scale: [1, 1.01, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </motion.div>
                  </div>
                </div>
                
                {/* Presentation Mode Button */}
                <motion.button
                  onClick={useCallback(() => {
                    playSound('click');
                    // Navigate to current page with presentation mode
                    const currentPath = window.location.pathname;
                    navigate(`${currentPath}?mode=present`);
                  }, [navigate])}
                  onMouseEnter={useCallback(() => playSound('hover'), [])}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                >
                  <Play size={20} />
                  <span>Start Presentation</span>
                </motion.button>
              </div>
              
              <motion.div 
                className="text-8xl ml-8 cursor-pointer"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                onMouseEnter={useCallback(async () => {
                  try {
                    await initializeAudio();
                    await playSound('hover');
                  } catch (error) {
                    console.log('Audio error:', error);
                  }
                }, [])}
                onClick={useCallback(async () => {
                  try {
                    await initializeAudio();
                    await playSound('click');
                  } catch (error) {
                    console.log('Audio error:', error);
                  }
                  navigate('/profile');
                }, [navigate])}
              >
                {user?.avatar}
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8"
          >
                         <ModernStatsCard
               title="Picking Station"
               value={stats.todayOrders}
               icon={Package}
               iconType="order"
               color="primary"
               onClick={async () => await handleStatClick('todayOrders')}
               actualQuantity={stats.pickingQuantity}
               actionText="Click to pick"
             />
            <ModernStatsCard
              title="Packing Station"
              value={stats.pendingOrders}
              icon={Clock}
              iconType="box"
              color="warning"
              onClick={() => handleStatClick('pendingOrders')}
              actualQuantity={stats.packingQuantity}
              actionText="Click to pack"
            />
            <ModernStatsCard
              title="Shipping Station"
              value={stats.activePickingTasks}
              icon={Activity}
              iconType="activity"
              color="success"
              onClick={() => handleStatClick('activePickingTasks')}
              actualQuantity={stats.shippingQuantity}
              actionText="View shipped orders"
            />
            <ModernStatsCard
              title="Inwards Station"
              value={stats.packingQueue}
              icon={Truck}
              iconType="van"
              color="purple"
              onClick={() => handleStatClick('packingQueue')}
              actualQuantity={stats.inwardsQuantity}
              actionText="Book in goods"
            />
            <ModernStatsCard
              title="Stock Control"
              value={stats.teamPerformance}
              icon={Users}
              iconType="controlPanel"
              color="success"
              onClick={() => handleStatClick('teamPerformance')}
              actualQuantity={stats.stockControlQuantity}
              actionText="Edit stock"
            />
          </motion.div>

          {/* Charts Overview */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Suspense fallback={
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl h-96 flex items-center justify-center">
                <div className="text-white text-lg">Loading chart...</div>
              </div>
            }>
              <OptimizedAreaChart
                data={[
                  { time: '8AM', orders: 4 },
                  { time: '10AM', orders: 12 },
                  { time: '12PM', orders: 8 },
                  { time: '2PM', orders: 15 },
                  { time: '4PM', orders: 6 }
                ]}
                title="Orders Today"
                color="#3b82f6"
                gradientId="orderGradient"
              />
            </Suspense>

            <Suspense fallback={
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl h-96 flex items-center justify-center">
                <div className="text-white text-lg">Loading chart...</div>
              </div>
            }>
              <OptimizedPerformanceChart
                stats={stats}
                selectedMetric={selectedMetric}
                onMetricChange={handleMetricChange}
              />
            </Suspense>
          </div>
        </motion.div>
      </div>
      
    </div>
  );
};

export default Dashboard;