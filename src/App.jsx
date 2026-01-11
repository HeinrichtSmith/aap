import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Home,
  PackageOpen,
  ClipboardList,
  PackageCheck,
  Truck,
  Box,
  User,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Activity,
  Bell,
  Search,
  Calendar,
  DollarSign,
  ScanLine,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Zap,
  Lock,
  Printer,
  BarChart3,
  Users,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Settings,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Import the WarehouseProvider and useWarehouse hook
import { WarehouseProvider, useWarehouse } from './hooks/useWarehouseContext';
import { SettingsProvider, useSettings } from './hooks/useSettings';

// Import audio utilities for universal sound support
import { initializeAudio, isAudioInitialized, playSound } from './utils/audio';

// Import page components
import Dashboard from './pages/Dashboard';
import Picking from './pages/Picking';
import Packing from './pages/Packing';
import StockControl from './pages/StockControl';
import Inwards from './pages/Inwards';
import Profile from './pages/Profile';
import Products from './pages/Products';
import Login from './pages/Login';
import Shipping from './pages/Shipping';
import ProgressRing from './components/ProgressRing';
import Presentation from './pages/Presentation';
import PresentationWrapper from './components/PresentationWrapper';
import Chatbot from './components/Chatbot';
import CustomCursor from './components/CustomCursor';

// Create alias for compatibility with existing components
const useApp = useWarehouse;

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    // Log to external service (e.g., Sentry, LogRocket, etc.)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // In production, you would send this to an error tracking service
    const errorData = {
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Example: Send to your logging endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // });

    console.log('Error logged:', errorData);
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-800">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={40} className="text-red-500" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2">Oops! Something went wrong</h1>
              <p className="text-gray-400 mb-6">
                We're sorry for the inconvenience. The error has been logged and we'll fix it soon.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-3xl text-gray-500 hover:text-gray-300">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-red-400 text-3xl font-mono mb-2">
                      {this.state.error.toString()}
                    </p>
                    <pre className="text-xs text-gray-500 overflow-auto max-h-48">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Try Again</span>
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global Error Handler Hook
const useErrorHandler = () => {
  const navigate = useNavigate();

  const handleError = (error, errorInfo = {}) => {
    console.error('Error handled:', error, errorInfo);
    
    // Determine error type and severity
    const errorType = error.name || 'UnknownError';
    const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network');
    const isAuthError = error.status === 401 || error.message?.includes('unauthorized');
    
    // Show appropriate toast message
    if (isNetworkError) {
      toast.error('Network error. Please check your connection.');
    } else if (isAuthError) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
    } else {
      toast.error(error.message || 'An unexpected error occurred');
    }
    
    // Log to service
    logError(error, errorInfo);
  };

  return { handleError };
};

// Error logging function
const logError = (error, context = {}) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    type: error.name,
    timestamp: new Date().toISOString(),
    context,
    browser: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer
    }
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.group('🔴 Error Log');
    console.error('Error:', error);
    console.table(context);
    console.groupEnd();
  }

  // Send to logging service in production
  // Example: logToSentry(errorLog);
};

// Network Error Handler
const handleNetworkError = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // Response wasn't JSON
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.response = response;
    
    throw error;
  }
  
  return response;
};

// Async Error Wrapper
const asyncHandler = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { function: fn.name, args });
      throw error;
    }
  };
};

// Protected Route Component with Error Handling - FIXED VERSION
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useWarehouse();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Render children if authenticated
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

// Search Modal Component
const SearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const searchableItems = [
    { type: 'order', id: 'ORD-2025-001', description: 'Auckland Security - 5 items', path: '/picking' },
    { type: 'product', id: 'ARM-SENS-001', description: 'PIR Motion Sensor', path: '/products', sku: 'ARM-SENS-001' },
    { type: 'po', id: 'PO-2025-001', description: 'TechSense Ltd - $14,000', path: '/inwards' },
  ];

  const filteredItems = searchableItems.filter(item =>
    item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (item) => {
    // If it's a product, navigate with SKU parameter
    if (item.type === 'product' && item.sku) {
      navigate(`${item.path}?sku=${item.sku}`);
    } else {
      navigate(item.path);
    }
    onClose();
    setSearchQuery('');
    playSound('success');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-full max-w-2xl bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Search size={24} className="text-gray-400" />
                </motion.div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search orders, products, or purchase orders..."
                  className="flex-1 bg-transparent text-white text-3xl outline-none placeholder:text-gray-500"
                  autoFocus
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    onClose();
                    playSound('click');
                  }}
                  onMouseEnter={() => playSound('hover')}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </motion.button>
              </div>
              
              <motion.div className="space-y-2">
                <AnimatePresence>
                  {filteredItems.map((item, index) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 10 }}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => playSound('hover')}
                      className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-all duration-300 text-left flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-white">{item.id}</p>
                        <p className="text-3xl text-gray-400">{item.description}</p>
                      </div>
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-gray-500 group-hover:text-gray-300"
                      >
                        {item.type.toUpperCase()}
                      </motion.span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Notifications Panel Component
const NotificationsPanel = ({ isOpen, onClose }) => {
  const { notifications, addNotification } = useWarehouse();

  if (!isOpen) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertCircle className="text-yellow-400" size={20} />;
      case 'success': return <CheckCircle className="text-green-400" size={20} />;
      default: return <Bell className="text-blue-400" size={20} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed right-0 top-20 h-[calc(100%-5rem)] w-96 bg-gray-900 border-l border-gray-800 shadow-2xl z-50 rounded-tl-xl"
          >
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white">Notifications</h2>
                <button
                  onClick={() => {
                    onClose();
                    playSound('click');
                  }}
                  onMouseEnter={() => playSound('hover')}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {(!notifications || notifications.length === 0) ? (
                <p className="text-center text-gray-500 py-8">No new notifications</p>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-gray-800/50 p-4 rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{notification.title}</h3>
                        <p className="text-3xl text-gray-400 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{notification.time || 'Just now'}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Settings Panel Component
const SettingsPanel = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed right-0 top-20 h-[calc(100%-5rem)] w-96 bg-gray-900 border-l border-gray-800 shadow-2xl z-50 rounded-tl-xl"
          >
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Settings size={24} />
                  <span>Settings</span>
                </h2>
                <button
                  onClick={() => {
                    onClose();
                    playSound('click');
                  }}
                  onMouseEnter={() => playSound('hover')}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-5rem)]">
              {/* Sound Effects Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {settings.soundEffects ? (
                      <Volume2 className="text-blue-400" size={20} />
                    ) : (
                      <VolumeX className="text-gray-500" size={20} />
                    )}
                    <div>
                      <h3 className="font-medium text-white">Sound Effects</h3>
                      <p className="text-sm text-gray-400">Enable UI sound effects</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      updateSettings({ soundEffects: !settings.soundEffects });
                      if (!settings.soundEffects) playSound('click');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.soundEffects ? 'bg-blue-500' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.soundEffects ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Volume Level */}
              {settings.soundEffects && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block">
                    <span className="text-white font-medium">Volume: {settings.volumeLevel}%</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.volumeLevel}
                      onChange={(e) => updateSettings({ volumeLevel: parseInt(e.target.value) })}
                      className="w-full mt-2 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </label>
                </motion.div>
              )}

              <div className="h-px bg-gray-800" />

              {/* Extra Effects Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Sparkles className={settings.showAnimations ? "text-purple-400" : "text-gray-500"} size={20} />
                    <div>
                      <h3 className="font-medium text-white">Extra Effects</h3>
                      <p className="text-sm text-gray-400">Enable visual animations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      updateSettings({ showAnimations: !settings.showAnimations });
                      playSound('click');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showAnimations ? 'bg-purple-500' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showAnimations ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="h-px bg-gray-800" />

              {/* Achievement Notifications Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className={settings.achievementNotifications ? "text-green-400" : "text-gray-500"} size={20} />
                    <div>
                      <h3 className="font-medium text-white">Achievement Notifications</h3>
                      <p className="text-sm text-gray-400">Show achievement popups</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      updateSettings({ achievementNotifications: !settings.achievementNotifications });
                      playSound('click');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.achievementNotifications ? 'bg-green-500' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.achievementNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Navigation Component
const Navigation = () => {
  const { user, logout, notifications } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pickingData, setPickingData] = useState(null);

  // Poll for picking page data updates
  useEffect(() => {
    let interval;
    if (location.pathname === '/picking') {
      // Check immediately on mount
      if (window.pickingPageData) {
        setPickingData({ ...window.pickingPageData });
      } else {
        setPickingData(null);
      }
      
      // Then poll for updates more frequently
      interval = setInterval(() => {
        if (window.pickingPageData) {
          setPickingData({ ...window.pickingPageData });
        } else {
          // Clear picking data if window data is cleared
          setPickingData(null);
        }
      }, 100); // Update every 100ms for more responsive UI
    } else {
      // Clear picking data immediately when leaving picking route
      setPickingData(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [location.pathname]);
  const [showAudioStatus, setShowAudioStatus] = useState(true);
  
  const navItems = [];
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="sticky top-0 z-50"
        style={{ zIndex: 1000 }}
      >
        <div className="px-6">
          <div className="flex items-center h-16 relative">
            {/* Left side - Back button (when on picking page) */}
            <div className="flex items-center space-x-1">
              {location.pathname === '/picking' && (
                <motion.button
                  onClick={() => {
                    // Check if we're in the actual picking screen
                    if (pickingData && pickingData.isPickingScreen && pickingData.onBack) {
                      // If we're in the picking screen, go back to order selection
                      pickingData.onBack();
                    } else {
                      // If we're in order selection, go to dashboard
                      navigate('/dashboard');
                    }
                    playSound('click');
                  }}
                  onMouseEnter={() => playSound('hover')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200"
                >
                  <ArrowLeft size={20} className="text-white" />
                  <span className="text-white font-medium">Back</span>
                </motion.button>
              )}
              
              {/* Desktop Navigation Items */}
              <div className="hidden md:flex items-center space-x-1">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AnimatePresence mode="wait">
                      <NavLink
                      to={item.path}
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                      className={({ isActive }) =>
                        `relative px-4 py-2 rounded-lg text-3xl font-medium transition-all duration-300 ${
                          isActive 
                            ? 'text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`
                      }
                      style={{ position: 'relative', zIndex: 2 }}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-lg"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              style={{ zIndex: 1 }}
                            />
                          )}
                          <span className="relative z-10">{item.name}</span>
                        </>
                      )}
                    </NavLink>
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Center - Logo (absolutely centered) */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <motion.button
                className="flex items-center space-x-3 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  navigate('/dashboard');
                  playSound('click');
                  // Reload the page after navigation
                  setTimeout(() => {
                    window.location.reload();
                  }, 100);
                }}
                onMouseEnter={() => playSound('hover')}
              >
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">OpsUI</h1>
                </div>
              </motion.button>
            </div>
            
            {/* Right side - All elements moved to very right */}
            <div className="flex items-center space-x-4 ml-auto">
              {/* Picking specific order info - Only show on picking page */}
              {location.pathname === '/picking' && pickingData && (
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-px bg-white/20" />
                  <div className="flex flex-col">
                    <span className="text-white/60 text-sm">Order</span>
                    <span className="text-white font-bold text-lg">{pickingData.orderId || 'Loading...'}</span>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="flex flex-col">
                    <span className="text-white/60 text-sm">Customer</span>
                    <span className="text-white font-medium text-lg">{pickingData.customer || 'Loading...'}</span>
                  </div>
                </div>
              )}
              
              {/* Picking Timer and Progress - Only show on picking page */}
              {location.pathname === '/picking' && pickingData && (
                <>
                  <div className="px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <div className="flex items-center space-x-2">
                      <Clock className="text-blue-400" size={20} />
                      <span className="text-white font-mono text-lg">
                        {pickingData.timerDisplay || '00:00'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <ProgressRing 
                      progress={(pickingData.orderProgress || 0) / 100} 
                      size={50}
                      strokeWidth={4}
                      strokeColor="#3b83f6"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {pickingData.remainingItems || pickingData.totalItems || 0}
                      </span>
                    </div>
                  </div>
                </>
              )}
              
              {/* Search button - hidden during actual picking */}
              {!pickingData && (
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowSearch(true);
                    playSound('click');
                  }}
                  onMouseEnter={() => playSound('hover')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-300"
                >
                  <Search size={20} />
                </motion.button>
              )}
              
              {/* Notifications button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowSettings(false);
                  playSound('click');
                }}
                onMouseEnter={() => playSound('hover')}
                className={`p-2 rounded-lg transition-all duration-300 relative ${
                  showNotifications
                    ? 'text-blue-400 bg-blue-500/20 hover:text-blue-300 hover:bg-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Bell size={20} />
                {notifications && notifications.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                    className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                  />
                )}
              </motion.button>

              {/* Settings button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowNotifications(false);
                  playSound('click');
                }}
                onMouseEnter={() => playSound('hover')}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  showSettings
                    ? 'text-purple-400 bg-purple-500/20 hover:text-purple-300 hover:bg-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Settings size={20} />
              </motion.button>

              {/* Logout button - hidden during actual picking */}
              {!pickingData && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    handleLogout();
                    playSound('click');
                  }}
                  onMouseEnter={() => playSound('hover')}
                  className="hidden md:block p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-300"
                >
                  <LogOut size={18} />
                </motion.button>
              )}
              
              {/* Mobile menu */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  playSound('click');
                }}
                onMouseEnter={() => playSound('hover')}
                className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                <motion.div
                  animate={{ rotate: mobileMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </motion.div>
              </motion.button>
            </div>
          </div>
          
          {/* Audio Status Indicator */}
          {!isAudioInitialized() && showAudioStatus && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 mb-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center"
            >
              <div className="flex items-center justify-center space-x-2 text-yellow-400 text-3xl">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🔇
                </motion.div>
                <span>Click anywhere to enable sound effects</span>
                <button
                  onClick={() => setShowAudioStatus(false)}
                  className="ml-2 text-yellow-400/60 hover:text-yellow-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-gray-800 bg-gray-900/95 backdrop-blur-xl overflow-hidden"
              style={{ zIndex: 1000 }}
            >
              <div className="px-4 py-4 space-y-1">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NavLink
                      to={item.path}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        playSound('click');
                      }}
                      onMouseEnter={() => playSound('hover')}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border border-blue-500/50' 
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                        <item.icon size={20} />
                      </motion.div>
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                  </motion.div>
                ))}
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.05 }}
                  onClick={() => {
                    handleLogout();
                    playSound('click');
                  }}
                  onMouseEnter={() => playSound('hover')}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-300"
                >
                  <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                    <LogOut size={20} />
                  </motion.div>
                  <span className="font-medium">Logout</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      
      {/* Search Modal */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Notifications Panel */}
      <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Settings Panel */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};

// Layout wrapper
const Layout = ({ children }) => {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogoClick = () => {
    // If already on dashboard, refresh the page
    if (window.location.pathname === '/dashboard') {
      window.location.reload();
    } else {
      // Otherwise navigate to dashboard
      navigate('/dashboard');
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-950 relative"
    >
      {/* Fixed background that extends to full document height */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 z-0">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      {/* Content container */}
      <div className="relative z-10">
        {/* Navigation Component */}
        <Navigation />
        
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 py-6 relative"
        >
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </motion.main>
      </div>
    </motion.div>
  );
};

// Main App with Error Handling
function App() {
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Global audio initialization on first user interaction
  useEffect(() => {
    const handleFirstInteraction = async (event) => {
      // Only initialize once
      if (isAudioInitialized() || audioInitialized) return;

      console.log('🔊 First user interaction detected, initializing audio globally...');
      
      try {
        const success = await initializeAudio();
        if (success) {
          setAudioInitialized(true);
          console.log('✅ Global audio initialized successfully');
          // Play a subtle welcome sound
          setTimeout(() => playSound('click'), 100);
        } else {
          console.log('❌ Global audio initialization failed');
        }
      } catch (error) {
        console.log('❌ Global audio initialization error:', error);
      }
      
      // Remove all listeners after first successful interaction
      document.removeEventListener('click', handleFirstInteraction, true);
      document.removeEventListener('touchstart', handleFirstInteraction, true);
      document.removeEventListener('keydown', handleFirstInteraction, true);
      document.removeEventListener('mousedown', handleFirstInteraction, true);
    };

    // Check if audio is already initialized
    if (isAudioInitialized()) {
      setAudioInitialized(true);
    } else {
      // Listen for any user interaction with capture phase to ensure we get it first
      document.addEventListener('click', handleFirstInteraction, true);
      document.addEventListener('touchstart', handleFirstInteraction, true);
      document.addEventListener('keydown', handleFirstInteraction, true);
      document.addEventListener('mousedown', handleFirstInteraction, true);
    }

    return () => {
      // Cleanup listeners on unmount
      document.removeEventListener('click', handleFirstInteraction, true);
      document.removeEventListener('touchstart', handleFirstInteraction, true);
      document.removeEventListener('keydown', handleFirstInteraction, true);
      document.removeEventListener('mousedown', handleFirstInteraction, true);
    };
  }, [audioInitialized]);

  // Global unhandled promise rejection handler
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      logError(event.reason, {
        type: 'unhandledRejection',
        promise: event.promise
      });
      
      toast.error('An unexpected error occurred. Please try again.');
      
      // Prevent default browser behavior
      event.preventDefault();
    };

    const handleGlobalError = (event) => {
      console.error('Global error:', event.error);
      
      logError(event.error, {
        type: 'globalError',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      
      // Prevent default browser behavior for handled errors
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <SettingsProvider>
          <WarehouseProvider>
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
                style: {
                  background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                  border: '1px solid #10b981',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                duration: 6000,
                style: {
                  background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                  border: '1px solid #ef4444',
                },
              },
              // Custom animation
              className: 'toast-animation',
            }}
          />
          <PresentationWrapper>
            <CustomCursor />
            {/* <Chatbot /> */}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inwards"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inwards />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock-control"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StockControl />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/picking"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Picking />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/packing"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Packing />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shipping"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Shipping />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Products />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* 404 Route */}
            <Route
              path="*"
              element={
                <Layout>
                  <NotFound />
                </Layout>
              }
            />
            </Routes>
          </PresentationWrapper>
          </WarehouseProvider>
        </SettingsProvider>
      </Router>
    </ErrorBoundary>
  );
}

// 404 Not Found Component
const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[60vh] flex items-center justify-center"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="text-center"
      >
        <motion.div 
          className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6"
          animate={{ 
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          <AlertCircle size={48} className="text-gray-500" />
        </motion.div>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-white mb-2"
        >
          404
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl text-gray-400 mb-8"
        >
          Page not found
        </motion.p>
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            navigate('/dashboard');
            playSound('transition');
          }}
          onMouseEnter={() => playSound('hover')}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
        >
          Return to Dashboard
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default App;
