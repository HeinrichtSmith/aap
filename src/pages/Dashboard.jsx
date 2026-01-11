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

// Import API service
import api from '../services/api';

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
    primary: "from-[#3A86B6] to-[#2A7696]",
    warning: "from-amber-600 to-amber-700",
    success: "from-emerald-600 to-emerald-700",
    danger: "from-red-600 to-red-700",
    purple: "from-purple-600 to-purple-700",
    pink: "from-pink-600 to-pink-700"
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
      className="bg-[#151A20] backdrop-blur-xl border border-[#1F2630] p-8 rounded-xl cursor-pointer relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#3A86B6]/10"
      whileHover={{ y: -8, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
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
          <h3 className="text-5xl font-bold mb-3 bg-gradient-to-r from-[#E6EAF0] to-[#A0A7B4] bg-clip-text text-transparent">
            <AnimatedCounter target={value} duration={1500} />
          </h3>
          <button
            onClick={handleClick}
            className="text-[#A0A7B4] text-lg font-medium hover:text-[#4A96C6] transition-colors duration-200 cursor-pointer"
          >
            {title}
          </button>
        </motion.div>

        {/* Interactive indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex items-center text-[#3A86B6] opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          <ChevronRight size={16} className="mr-2" />
          <span className="text-sm font-medium">{actionText}</span>
        </motion.div>
      </div>
    </motion.div>
  );
});

ModernStatsCard.displayName = 'ModernStatsCard';

// Professional color scheme matching marketing site
const colorScheme = {
  background: {
    primary: '#0B0D10',
    secondary: '#111418',
    tertiary: '#151A20',
  },
  surface: {
    base: '#151A20',
    elevated: '#1A1F28',
    border: '#1F2630',
  },
  text: {
    primary: '#E6EAF0',
    secondary: '#A0A7B4',
    muted: '#6B7280',
  },
  accent: {
    default: '#3A86B6',
    hover: '#4A96C6',
    active: '#2A7696',
  },
};

// Main Dashboard Component
const Dashboard = () => {
  const { user, pickedOrders, packedOrders, availablePickingOrders } = useWarehouse();
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState('total'); // 'total', 'picked', 'packed'

  // State for dashboard data
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    pickingOrders: 0,
    packedOrders: 0,
    shippedOrders: 0,
    totalProducts: 0,
    totalInventory: 0
  });

  // Load dashboard stats from API
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const stats = await api.dashboard.getStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      }
    };
    
    loadDashboardStats();
  }, []);

  // Calculate real operational data
  const calculateStats = useCallback(() => {
    // Use context orders for picking/packing/shipping stations
    const ordersToBePicked = availablePickingOrders || [];
    const ordersToBePacked = pickedOrders || [];
    const ordersShipped = packedOrders || [];

    // Use API stats for other metrics
    const totalItemsPicked = ordersToBePacked.reduce((total, order) => {
      return total + (order.items ? order.items.length : 0);
    }, 0);

    const totalItemsPacked = ordersShipped.reduce((total, order) => {
      return total + (order.items ? order.items.length : 0);
    }, 0);

    return {
      // Display values (order counts)
      todayOrders: ordersToBePicked.length,
      pendingOrders: ordersToBePacked.length, 
      activePickingTasks: ordersShipped.length,
      packingQueue: dashboardStats.totalInventory || 0, // Using inventory count
      teamPerformance: dashboardStats.totalProducts || 0, // Using products count
      
      // GameIcon quantities (matching display values for consistency)
      pickingQuantity: ordersToBePicked.length,
      packingQuantity: ordersToBePacked.length,
      shippingQuantity: ordersShipped.length,
      inwardsQuantity: dashboardStats.totalInventory || 0,
      stockControlQuantity: dashboardStats.totalProducts || 0,
      
      // Dispatch Performance metrics
      totalItemsPicked: totalItemsPicked,
      totalItemsPacked: totalItemsPacked
    };
  }, [availablePickingOrders, pickedOrders, packedOrders, dashboardStats]);

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
            className="bg-[#151A20] backdrop-blur-xl border border-[#1F2630] p-8 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <motion.div
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#3A86B6] to-[#2A7696] flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Package size={32} className="text-white" />
                  </motion.div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-[#E6EAF0] to-[#A0A7B4] bg-clip-text text-transparent">
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
                      className="ml-2 hover:text-[#4A96C6] transition-colors cursor-pointer underline decoration-2 decoration-[#3A86B6]/50 hover:decoration-[#3A86B6] underline-offset-4"
                    >
                      {user?.name}!
                    </motion.button>
                  </h1>
                </div>
                <p className="text-[#A0A7B4] text-xl">
                  Ready to optimize your warehouse operations today?
                </p>
                
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
                  className="mt-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#3A86B6] to-[#2A7696] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#3A86B6]/25 transition-all duration-300"
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
              <div className="bg-[#151A20] backdrop-blur-xl border border-[#1F2630] p-8 rounded-xl h-96 flex items-center justify-center">
                <div className="text-[#E6EAF0] text-lg">Loading chart...</div>
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
                color="#3A86B6"
                gradientId="orderGradient"
              />
            </Suspense>

            <Suspense fallback={
              <div className="bg-[#151A20] backdrop-blur-xl border border-[#1F2630] p-8 rounded-xl h-96 flex items-center justify-center">
                <div className="text-[#E6EAF0] text-lg">Loading chart...</div>
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
