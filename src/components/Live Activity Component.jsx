import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  Target,
  ChevronRight,
  ArrowRight,
  Timer,
  BarChart3,
  Award,
  Sparkles,
  Trophy,
  Star,
  Boxes,
  ShoppingBag,
  Truck,
  Play,
  Pause,
  RotateCcw,
  Info,
  Shield,
  Cpu,
  Activity,
  Layers
} from 'lucide-react';
import { useWarehouse } from '../hooks/useWarehouseContext';
import { motion } from 'framer-motion';

// Helper functions
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Mock Data
const initialTotes = [
  { id: 'TOTE-001', orderId: 'SO5342', priority: 'overnight', customer: 'Auckland Security Systems', items: [{ id: 'SKU-A1', name: 'Premium Coffee Beans', quantity: 2 }, { id: 'SKU-B2', name: 'Stainless Steel Mug', quantity: 1 }] },
  { id: 'TOTE-002', orderId: 'SO5343', priority: 'normal', customer: 'Wellington Safety Co', items: [{ id: 'SKU-C3', name: 'Wireless Headphones', quantity: 1 }, { id: 'SKU-D4', name: 'USB-C Cable', quantity: 3 }] },
  { id: 'TOTE-003', orderId: 'SO5344', priority: 'overnight', customer: 'Christchurch Electronics', items: [{ id: 'SKU-E5', name: 'Laptop Stand', quantity: 1 }, { id: 'SKU-F6', name: 'Wireless Mouse', quantity: 2 }] },
  { id: 'TOTE-004', orderId: 'SO5345', priority: 'urgent', customer: 'Hamilton Tech Hub', items: [{ id: 'SKU-G7', name: 'Phone Case', quantity: 3 }, { id: 'SKU-H8', name: 'Screen Protector', quantity: 3 }] },
  { id: 'TOTE-005', orderId: 'SO5346', priority: 'normal', customer: 'Dunedin Digital', items: [{ id: 'SKU-I9', name: 'Power Bank', quantity: 1 }, { id: 'SKU-J10', name: 'Charging Cable Set', quantity: 2 }] },
];

const boxOptions = [
  { id: 'box-s', name: 'Small Box', dimensions: '20x20x10cm', courier: 'NZ Couriers', icon: '📦' },
  { id: 'box-m', name: 'Medium Box', dimensions: '30x30x15cm', courier: 'NZ Couriers', icon: '📦' },
  { id: 'box-l', name: 'Large Box', dimensions: '40x40x20cm', courier: 'NZ Couriers', icon: '📦' },
];

const courierBagOptions = [
  { id: 'nzc-a4', name: 'NZ Couriers A4 Satchel', courier: 'NZ Couriers', icon: '🛍️' },
  { id: 'nzc-a3', name: 'NZ Couriers A3 Satchel', courier: 'NZ Couriers', icon: '🛍️' },
  { id: 'nzc-a2', name: 'NZ Couriers A2 Satchel', courier: 'NZ Couriers', icon: '🛍️' },
];

const palletOptions = [
  { id: 'pallet-half', name: 'Half Pallet', dimensions: '60x80cm', courier: 'Mainfreight', icon: '🏗️' },
  { id: 'pallet-full', name: 'Full Pallet', dimensions: '120x80cm', courier: 'Mainfreight', icon: '🏗️' },
  { id: 'pallet-oversized', name: 'Oversized Pallet', dimensions: '120x120cm', courier: 'Mainfreight', icon: '🏗️' },
];

// Background Component - Subtle animated gradient
const AnimatedBackground = () => {
  return (
    <>
      <style jsx global>{`
        @keyframes backgroundShift {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.1);
          }
        }
        
        body {
          background: #0a0a0a;
          position: relative;
        }
        
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), 
                      radial-gradient(circle at 80% 80%, rgba(96, 165, 250, 0.05) 0%, transparent 50%), 
                      radial-gradient(circle at 40% 20%, rgba(76, 175, 80, 0.05) 0%, transparent 50%);
          z-index: -1;
          animation: backgroundShift 20s ease-in-out infinite;
          pointer-events: none;
        }
        
        /* Custom Scrollbar Styles */
        .modal-content-scroll::-webkit-scrollbar {
          width: 10px;
        }
        
        .modal-content-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        
        .modal-content-scroll::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 10px;
          border: 2px solid rgba(0, 0, 0, 0.2);
        }
        
        .modal-content-scroll::-webkit-scrollbar-thumb:hover {
          background: #60a5fa;
        }
        
        /* Confirmation Modal Specific */
        .confirmation-modal-scroll::-webkit-scrollbar {
          width: 12px !important;
        }
        
        .confirmation-modal-scroll::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.1) !important;
          border-radius: 10px !important;
          margin: 4px 0 !important;
        }
        
        .confirmation-modal-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6) !important;
          border-radius: 10px !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .confirmation-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #60a5fa, #a78bfa) !important;
        }
        
        /* Firefox */
        .modal-content-scroll {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 rgba(255, 255, 255, 0.05);
        }
        
        .confirmation-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </>
  );
};

// Particle Effect Component
const ParticleEffect = ({ active }) => {
  const [particles] = useState(() => 
    [...Array(30)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 10 + Math.random() * 15,
      size: Math.random() * 16 + 8,
    }))
  );

  if (!active) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <style jsx>{`
        @keyframes particleFloat {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          100% {
            transform: translate(100px, -100px) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes particleDrift {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(30px) translateY(-30px);
          }
          50% {
            transform: translateX(-20px) translateY(20px);
          }
          75% {
            transform: translateX(40px) translateY(10px);
          }
        }
        
        .particle {
          position: absolute;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0) 70%);
          border-radius: 50%;
          animation: particleFloat var(--duration) linear infinite, particleDrift 15s ease-in-out infinite;
          animation-delay: var(--delay);
          filter: blur(0.5px);
        }
      `}</style>
      
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            '--delay': `${particle.animationDelay}s`,
            '--duration': `${particle.animationDuration}s`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
        />
      ))}
    </div>
  );
};

// Animated XP Counter
const AnimatedCounter = ({ target, duration = 2000, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [target, duration]);
  
  return <span>{prefix}{count}{suffix}</span>;
};

// Confetti Component
const Confetti = ({ active }) => {
  if (!active) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full animate-confetti"
          style={{
            backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][i % 5],
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${Math.random() * 2 + 2}s`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
};

// Enhanced Scan Input with animation
const ScanInput = ({ onScan, placeholder = "Scan or enter barcode...", expectedValue = null, autoFocus = true, showResult = true }) => {
  const [value, setValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!autoFocus) return;

    const handleFocus = () => {
      if (inputRef.current && document.activeElement !== inputRef.current && !scanning) {
        inputRef.current.focus();
      }
    };

    const interval = setInterval(handleFocus, 500);
    
    const handleClick = (e) => {
      if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
        handleFocus();
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleClick);
    };
  }, [autoFocus, scanning]);

  const handleScan = (scanValue) => {
    setScanning(true);

    setTimeout(() => {
      const isValid = !expectedValue || scanValue === expectedValue;
      
      if (isValid) {
        setResult('success');
        onScan(scanValue);
      } else {
        setResult('error');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }

      setScanning(false);
      
      if (showResult && isValid) {
        setTimeout(() => {
          setResult(null);
          setValue('');
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 500);
      } else if (showResult && !isValid) {
        setTimeout(() => {
          setResult(null);
          setValue('');
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 1000);
      } else {
        setValue('');
        setResult(null);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }, 200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      handleScan(value.trim());
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value.toUpperCase();
    setValue(newValue);
    
    if (newValue.length >= 8 && /^[A-Z0-9-]+$/.test(newValue)) {
      setTimeout(() => {
        if (value === newValue && newValue.trim()) {
          handleScan(newValue.trim());
        }
      }, 50);
    }
  };

  return (
    <div className={`relative ${isShaking ? 'animate-shake' : ''}`}>
      <div className="relative">
        <Target className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
          scanning ? 'text-blue-500 animate-pulse' : result === 'error' ? 'text-red-400' : 'text-gray-400'
        }`} size={20} />
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
          placeholder={placeholder}
          className={`w-full pl-12 pr-12 py-3 bg-white/5 border rounded-xl text-white transition-all ${
            scanning ? 'border-blue-500 bg-blue-500/10' : ''
          } ${
            result === 'error' ? 'border-red-500 bg-red-500/10' : 'border-white/10'
          } ${
            result === 'success' ? 'border-green-500 bg-green-500/10' : ''
          }`}
          disabled={scanning}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        
        {scanning && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {result && showResult && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 scale-in">
            {result === 'success' ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <AlertCircle className="text-red-500" size={24} />
            )}
          </div>
        )}
      </div>

      {expectedValue && (
        <p className="text-xs text-gray-400 mt-1">
          Expected: <span className="font-mono text-white">{expectedValue}</span>
        </p>
      )}
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

// PackingTimer Component (renamed from Timer to avoid conflict)
const PackingTimer = ({ onComplete, isActive }) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive && seconds > 0) {
      onComplete(seconds);
    }
  }, [isActive, seconds, onComplete]);

  return (
    <div className="flex items-center space-x-2">
      <Timer className="text-blue-400 animate-pulse" size={20} />
      <div className="text-5xl font-mono bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
        {formatTime(seconds)}
      </div>
    </div>
  );
};

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const getPriorityStyle = () => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const getPriorityIcon = () => {
    switch (priority) {
      case 'urgent':
        return <Zap size={14} />;
      case 'high':
        return <TrendingUp size={14} />;
      default:
        return <Activity size={14} />;
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border flex items-center gap-1 ${getPriorityStyle()}`}>
      {getPriorityIcon()}
      {priority}
    </span>
  );
};

// Tote Selection Screen Component with enhanced animations
const ToteSelectionScreen = ({ totes, onSelectTote }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'from-red-500/20 to-red-600/10';
      case 'high': return 'from-orange-500/20 to-orange-600/10';
      default: return 'from-blue-500/20 to-blue-600/10';
    }
  };

  return (
    <div className="min-h-screen w-full p-8 overflow-auto relative">
      <div className="w-full relative z-10">
        <div className="text-center mb-12 fade-in">
          <div className="flex items-center justify-center mb-4">
            <Boxes className="text-blue-400 mr-3" size={48} />
            <h1 className="text-6xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Select a Tote
            </h1>
          </div>
          <p className="text-sm text-gray-400 flex items-center justify-center">
            <Package className="mr-2" size={20} />
            Choose an order tote to begin your packing run
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-[2400px] mx-auto">
          {totes.map((tote, index) => (
            <div
              key={tote.id}
              onClick={() => onSelectTote(tote)}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`bg-white/[0.03] backdrop-blur-xl rounded-3xl p-8 h-full hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:border-blue-500/50 border border-white/10 relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${getPriorityColor(tote.priority)} opacity-50`} />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/5 group-hover:to-blue-500/10 rounded-3xl transition-all duration-500" />
                
                <div className="relative">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors flex items-center">
                        <Package className="mr-2" size={28} />
                        {tote.id}
                      </h2>
                      <p className="text-gray-500 font-medium group-hover:text-gray-400 transition-colors flex items-center">
                        <Shield className="mr-1" size={16} />
                        {tote.orderId}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{tote.customer}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <PriorityBadge priority={tote.priority} />
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                          {tote.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {tote.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-800/50 last:border-0 group-hover:border-gray-700/50 transition-colors">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-300 group-hover:text-gray-200 transition-colors">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-600 group-hover:text-gray-500 transition-colors flex items-center">
                            <Cpu className="mr-1" size={12} />
                            {item.id}
                          </p>
                        </div>
                        <span className="font-bold text-gray-400 ml-2 group-hover:text-gray-300 transition-colors">
                          ×{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <Play className="animate-pulse" size={16} />
                      <span className="font-semibold">Start Packing Run</span>
                      <ArrowRight className="transform group-hover:translate-x-2 transition-transform" size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Progress Ring Component
const ProgressRing = ({ progress, size = 60, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress * circumference);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#gradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// Packing Screen Component with gamification
const PackingScreen = ({ tote, onComplete }) => {
  const [scannedItems, setScannedItems] = useState([]);
  const [timerActive, setTimerActive] = useState(true);
  const [scanMode, setScanMode] = useState(true);
  const [combo, setCombo] = useState(0);
  const [showComboAnimation, setShowComboAnimation] = useState(false);
  const [perfectStreak, setPerfectStreak] = useState(true);

  const handleItemScan = (scannedSKU) => {
    const item = tote.items.find(i => i.id === scannedSKU);
    if (!item) {
      setCombo(0);
      setPerfectStreak(false);
      return;
    }

    const scannedCount = scannedItems.filter(id => id === scannedSKU).length;
    if (scannedCount >= item.quantity) {
      return;
    }

    setScannedItems([...scannedItems, scannedSKU]);
    setCombo(prev => prev + 1);
    
    if (combo > 0 && combo % 5 === 0) {
      setShowComboAnimation(true);
      setTimeout(() => setShowComboAnimation(false), 1000);
    }
    
    const newScannedItems = [...scannedItems, scannedSKU];
    const allScanned = tote.items.every(item => {
      const count = newScannedItems.filter(id => id === item.id).length;
      return count >= item.quantity;
    });

    if (allScanned) {
      setTimeout(() => {
        setTimerActive(false);
      }, 500);
    }
  };

  const handleItemClick = (itemId) => {
    if (!scanMode) {
      handleItemScan(itemId);
    }
  };

  const isItemFullyScanned = (itemId) => {
    const item = tote.items.find(i => i.id === itemId);
    const scannedCount = scannedItems.filter(id => id === itemId).length;
    return scannedCount >= item.quantity;
  };

  const getScannedCount = (itemId) => {
    return scannedItems.filter(id => id === itemId).length;
  };

  const allItemsScanned = tote.items.every(item => {
    const scannedCount = scannedItems.filter(id => id === item.id).length;
    return scannedCount >= item.quantity;
  });

  const handleFinishPacking = (seconds) => {
    onComplete({ time: seconds, perfectStreak, combo });
  };

  const totalProgress = scannedItems.length / tote.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen w-full p-8 overflow-auto relative">
      {showComboAnimation && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-bounce">
            {combo}x COMBO!
          </div>
        </div>
      )}
      
      <div className="w-full max-w-[1600px] mx-auto relative z-10">
        {/* Header with enhanced stats */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-8 mb-8 fade-in relative overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
          <div className="relative">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-5xl font-bold text-white mb-3 tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent flex items-center">
                  <Target className="mr-3 text-blue-400" size={48} />
                  Packing Station
                </h1>
                <div className="flex items-center space-x-6">
                  <span className="text-sm text-gray-500 flex items-center">
                    <Package className="mr-2" size={18} />
                    Tote: <span className="font-bold text-gray-300 ml-1">{tote.id}</span>
                  </span>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Shield className="mr-2" size={18} />
                    Order: <span className="font-bold text-gray-300 ml-1">{tote.orderId}</span>
                  </span>
                  <PriorityBadge priority={tote.priority} />
                </div>
              </div>
              
              <div className="flex gap-4">
                {/* Combo Counter */}
                <div className="text-center bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                  <p className="text-sm text-gray-500 mb-1 font-semibold uppercase tracking-wider flex items-center justify-center">
                    <Zap className="mr-1" size={14} />
                    Combo
                  </p>
                  <p className={`text-sm font-bold ${combo > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
                    {combo}x
                  </p>
                </div>
                
                {/* Perfect Streak */}
                <div className="text-center bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                  <p className="text-sm text-gray-500 mb-1 font-semibold uppercase tracking-wider flex items-center justify-center">
                    <Star className="mr-1" size={14} />
                    Streak
                  </p>
                  <div className={`text-sm ${perfectStreak ? 'text-green-400' : 'text-gray-600'}`}>
                    {perfectStreak ? '✓' : '✗'}
                  </div>
                </div>
                
                {/* Timer */}
                <div className="text-center bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden border border-white/10 min-w-[200px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse" />
                  <div className="relative">
                    <p className="text-sm text-gray-500 mb-3 font-semibold uppercase tracking-wider">Packing Time</p>
                    <PackingTimer onComplete={handleFinishPacking} isActive={timerActive} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Run Progress</span>
                <span className="text-sm font-bold text-blue-400">{Math.round(totalProgress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500"
                  style={{ width: `${totalProgress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-full p-1 inline-flex border border-white/10">
            <button
              onClick={() => setScanMode(true)}
              className={`px-6 py-2 rounded-full transition-all duration-300 flex items-center ${
                scanMode 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Target className="mr-2" size={16} />
              Scan Mode
            </button>
            <button
              onClick={() => setScanMode(false)}
              className={`px-6 py-2 rounded-full transition-all duration-300 flex items-center ${
                !scanMode 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="mr-2" size={16} />
              Manual Mode
            </button>
          </div>
        </div>

        {/* Scan Input */}
        {scanMode && (
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-8 mb-8 slide-in-left border border-white/10">
            <h2 className="text-sm font-bold mb-6 text-white flex items-center">
              <Target className="mr-3 text-blue-400" size={24} />
              Scan Items
            </h2>
            <ScanInput
              onScan={handleItemScan}
              placeholder="Scan barcode to verify items..."
              autoFocus={true}
              showResult={true}
            />
          </div>
        )}

        {/* Items List with enhanced UI */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-8 slide-in-right relative overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
          <div className="relative">
            <h2 className="text-sm font-bold mb-8 text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent flex items-center">
              <Package className="mr-3 text-blue-400" size={32} />
              Items to Pack
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tote.items.map((item, index) => {
                const scannedCount = getScannedCount(item.id);
                const isFullyScanned = isItemFullyScanned(item.id);
                
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`relative p-6 rounded-2xl border transition-all duration-300 transform hover:scale-105 ${
                      isFullyScanned
                        ? 'bg-green-900/20 border-green-500/50 hover:border-green-400/50'
                        : 'bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20'
                    } ${!scanMode ? 'cursor-pointer' : ''}`}
                    style={{ animationDelay: `${(index + 2) * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 hover:from-blue-500/10 hover:to-purple-500/10 rounded-2xl transition-all duration-300" />
                    
                    {/* Item Icon */}
                    <div className="absolute top-4 right-4">
                      <Cpu className={`${isFullyScanned ? 'text-green-400' : 'text-gray-600'}`} size={20} />
                    </div>
                    
                    <div className="relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`flex-1 ${isFullyScanned ? 'opacity-60' : ''}`}>
                          <p className="font-bold text-sm mb-2 text-white">{item.id}</p>
                          <p className={`text-gray-400 ${isFullyScanned ? 'line-through' : ''}`}>{item.name}</p>
                        </div>
                      </div>
                      
                      {/* Progress Circle */}
                      <div className="flex items-center justify-between">
                        <div className="relative">
                          <ProgressRing 
                            progress={scannedCount / item.quantity} 
                            size={60} 
                            strokeWidth={4}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-sm font-bold ${isFullyScanned ? 'text-green-400' : 'text-white'}`}>
                              {scannedCount}/{item.quantity}
                            </span>
                          </div>
                        </div>
                        
                        {isFullyScanned && (
                          <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-full p-3 scale-in shadow-lg shadow-green-500/50">
                            <CheckCircle className="text-white" size={24} />
                          </div>
                        )}
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-6 h-2 bg-white/10 rounded-full relative overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            isFullyScanned 
                              ? 'bg-gradient-to-r from-green-400 to-green-500' 
                              : 'bg-gradient-to-r from-blue-400 to-blue-500'
                          }`}
                          style={{ width: `${(scannedCount / item.quantity) * 100}%` }}
                        />
                      </div>
                      
                      {!scanMode && !isFullyScanned && (
                        <div className="mt-4 text-center text-sm text-gray-500">
                          Click to mark as scanned
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats Summary */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 text-center border border-white/10">
                <BarChart3 className="mx-auto mb-2 text-blue-400" size={24} />
                <p className="text-sm font-bold">{scannedItems.length}</p>
                <p className="text-xs text-gray-400">Items Scanned</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 text-center border border-white/10">
                <Package className="mx-auto mb-2 text-purple-400" size={24} />
                <p className="text-sm font-bold">{tote.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                <p className="text-xs text-gray-400">Total Items</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 text-center border border-white/10">
                <Trophy className="mx-auto mb-2 text-yellow-400" size={24} />
                <p className="text-sm font-bold">{tote.items.filter(item => isItemFullyScanned(item.id)).length}</p>
                <p className="text-xs text-gray-400">Completed</p>
              </div>
            </div>

            {/* Finish Button */}
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setTimerActive(false)}
                disabled={!allItemsScanned}
                className={`px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 transform transition-all duration-300 hover:scale-105 flex items-center ${
                  !allItemsScanned ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-blue-500/50'
                }`}
              >
                {allItemsScanned ? (
                  <>
                    <CheckCircle className="mr-2" size={20} />
                    Continue to Packaging
                  </>
                ) : (
                  <>
                    <Package className="mr-2" size={20} />
                    Scan all items to continue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Package Recommendation Component with AI indicator
const PackageRecommendation = ({ items, onSelect }) => {
  const calculateRecommendation = () => {
    const totalVolume = items.reduce((sum, item) => {
      const estimatedVolume = item.quantity * 0.002;
      return sum + estimatedVolume;
    }, 0);
    
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const hasFragile = items.some(item => item.name.toLowerCase().includes('camera') || item.name.toLowerCase().includes('touch'));
    
    if (totalItems === 1 && totalVolume < 0.005) {
      return { id: 'nzc-a4', type: 'satchel', reason: 'Single small item - courier bag recommended' };
    } else if (totalItems <= 3 && totalVolume < 0.01) {
      return { id: 'nzc-a3', type: 'satchel', reason: 'Few small items - medium courier bag recommended' };
    } else if (totalVolume < 0.015) {
      return { id: 'box-s', type: 'box', reason: hasFragile ? 'Small box for fragile protection' : 'Compact box for multiple items' };
    } else if (totalVolume < 0.02) {
      return { id: 'box-m', type: 'box', reason: 'Standard box for typical order size' };
    } else if (totalVolume < 0.03) {
      return { id: 'box-l', type: 'box', reason: 'Larger box for bulky items' };
    } else {
      return { id: 'pallet-half', type: 'pallet', reason: 'Large order - pallet recommended' };
    }
  };

  const recommendation = calculateRecommendation();

  return (
    <div className="relative bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-2xl p-6 mb-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse" />
      <div className="relative flex items-start space-x-4">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg shadow-blue-500/50">
          <Sparkles className="text-white" size={24} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-300 mb-2 text-sm flex items-center">
            <Cpu className="mr-2" size={18} />
            AI Recommendation
          </h4>
          <p className="text-gray-300 mb-3">{recommendation.reason}</p>
          <button
            onClick={() => onSelect(recommendation.id)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transform transition-all duration-300 hover:scale-105 flex items-center"
          >
            <Zap className="mr-2" size={16} />
            Use Recommended Package
          </button>
        </div>
      </div>
    </div>
  );
};

// Packaging Selection Screen Component with enhanced visuals
const PackagingSelectionScreen = ({ onSelect, items = [] }) => {
  const [selectedType, setSelectedType] = useState('boxes');
  const [selectedPackage, setSelectedPackage] = useState(null);

  const displayOptions = selectedType === 'boxes' ? boxOptions : 
                         selectedType === 'satchels' ? courierBagOptions : 
                         palletOptions;

  // Calculate AI recommendation
  const getRecommendedId = () => {
    const totalVolume = items.reduce((sum, item) => {
      const estimatedVolume = item.quantity * 0.002;
      return sum + estimatedVolume;
    }, 0);
    
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems === 1 && totalVolume < 0.005) return 'nzc-a4';
    else if (totalItems <= 3 && totalVolume < 0.01) return 'nzc-a3';
    else if (totalVolume < 0.015) return 'box-s';
    else if (totalVolume < 0.02) return 'box-m';
    else if (totalVolume < 0.03) return 'box-l';
    else return 'pallet-half';
  };

  const recommendedId = getRecommendedId();
  
  // Determine which tab contains the AI recommendation
  const getRecommendedTab = () => {
    if (boxOptions.some(opt => opt.id === recommendedId)) return 'boxes';
    if (courierBagOptions.some(opt => opt.id === recommendedId)) return 'satchels';
    if (palletOptions.some(opt => opt.id === recommendedId)) return 'pallets';
    return 'boxes';
  };
  
  const recommendedTab = getRecommendedTab();

  // Auto-select recommended item when tab changes
  useEffect(() => {
    const recommendedItem = displayOptions.find(opt => opt.id === recommendedId);
    if (recommendedItem && !selectedPackage) {
      setSelectedPackage(recommendedItem);
    }
  }, [selectedType, recommendedId, displayOptions, selectedPackage]);

  const getTabIcon = (type) => {
    switch(type) {
      case 'boxes': return <Boxes size={16} />;
      case 'satchels': return <ShoppingBag size={16} />;
      case 'pallets': return <Truck size={16} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full p-8 overflow-auto relative">
      <div className="w-full max-w-[1800px] mx-auto relative z-10">
        <div className="text-center mb-12 fade-in">
          <div className="flex items-center justify-center mb-4">
            <Package className="text-blue-400 mr-3" size={48} />
            <h1 className="text-6xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Select Packaging
            </h1>
          </div>
          <p className="text-sm text-gray-400 flex items-center justify-center">
            <Shield className="mr-2" size={20} />
            Choose the best packaging for this order
          </p>
        </div>

        {items.length > 0 && <PackageRecommendation items={items} onSelect={(id) => {
          const item = [...boxOptions, ...courierBagOptions, ...palletOptions].find(opt => opt.id === id);
          if (item) {
            // Switch to the correct tab if needed
            if (boxOptions.includes(item)) setSelectedType('boxes');
            else if (courierBagOptions.includes(item)) setSelectedType('satchels');
            else if (palletOptions.includes(item)) setSelectedType('pallets');
            setSelectedPackage(item);
          }
        }} />}

        <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-8 slide-in-right relative overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
          
          <div className="relative">
            {/* Toggle Buttons */}
            <div className="flex justify-center space-x-4 mb-10">
              <button
                onClick={() => {
                  setSelectedType('boxes');
                  setSelectedPackage(null);
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 relative flex items-center ${
                  selectedType === 'boxes' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                    : 'text-gray-400 hover:text-white bg-white/5'
                }`}
              >
                {getTabIcon('boxes')}
                <span className="ml-2">Boxes</span>
                {selectedType !== 'boxes' && recommendedTab === 'boxes' && (
                  <span className="absolute -top-2 -right-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>
              <button
                onClick={() => {
                  setSelectedType('satchels');
                  setSelectedPackage(null);
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 relative flex items-center ${
                  selectedType === 'satchels' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                    : 'text-gray-400 hover:text-white bg-white/5'
                }`}
              >
                {getTabIcon('satchels')}
                <span className="ml-2">Satchels</span>
                {selectedType !== 'satchels' && recommendedTab === 'satchels' && (
                  <span className="absolute -top-2 -right-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>
              <button
                onClick={() => {
                  setSelectedType('pallets');
                  setSelectedPackage(null);
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 relative flex items-center ${
                  selectedType === 'pallets' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                    : 'text-gray-400 hover:text-white bg-white/5'
                }`}
              >
                {getTabIcon('pallets')}
                <span className="ml-2">Pallets</span>
                {selectedType !== 'pallets' && recommendedTab === 'pallets' && (
                  <span className="absolute -top-2 -right-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayOptions.map((option, index) => (
                <div
                  key={option.id}
                  onClick={() => setSelectedPackage(option)}
                  className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    selectedPackage?.id === option.id
                      ? 'bg-blue-900/20 border-blue-500/50 shadow-xl shadow-blue-500/20'
                      : option.id === recommendedId
                      ? 'bg-white/[0.03] backdrop-blur-xl border-blue-500/30 hover:border-blue-500/50'
                      : 'bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-gray-600/50'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* AI Recommendation Badge - Enhanced Blue */}
                  {option.id === recommendedId && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-500/50 flex items-center space-x-1 animate-pulse">
                      <Sparkles size={14} />
                      <span>AI Pick</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 hover:from-blue-500/10 hover:to-purple-500/10 rounded-2xl transition-all duration-300" />
                  
                  <div className="relative text-center">
                    <div className="text-5xl mb-4 transform transition-transform duration-300 hover:scale-110">
                      {option.icon}
                    </div>
                    <h3 className="font-bold text-sm mb-2 text-white">{option.name}</h3>
                    <p className="text-gray-400 font-medium">{option.dimensions}</p>
                    {option.courier && (
                      <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10">
                        <Truck className="mr-1" size={12} />
                        <span className={option.courier === 'NZ Couriers' ? 'text-blue-400' : 'text-orange-400'}>
                          {option.courier}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {selectedPackage?.id === option.id && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full p-2 scale-in shadow-lg shadow-blue-500/50">
                      <CheckCircle className="text-white" size={20} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Confirm Button */}
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => onSelect(selectedPackage)}
                disabled={!selectedPackage}
                className={`px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 transform transition-all duration-300 hover:scale-105 flex items-center ${
                  !selectedPackage ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-blue-500/50'
                }`}
              >
                {selectedPackage ? (
                  <>
                    <CheckCircle className="mr-2" size={20} />
                    Confirm Packaging
                  </>
                ) : (
                  <>
                    <Package className="mr-2" size={20} />
                    Select a package to continue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Confirmation Modal with XP system
const ConfirmationModal = ({ order, packingTime, selectedPackage, onPrintLabel, onNewOrder, onEdit, packingStats }) => {
  const { addXP, updateStats } = useWarehouse();
  const [labelPrinted, setLabelPrinted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXPBreakdown, setShowXPBreakdown] = useState(false);
  const hasAwardedXP = useRef(false);

  // Calculate XP
  const baseXP = 50;
  const speedBonus = packingTime.time < 60 ? 25 : packingTime.time < 120 ? 15 : 0;
  const accuracyBonus = packingStats?.perfectStreak ? 30 : 0;
  const comboBonus = Math.min(packingStats?.combo || 0, 20) * 2;
  const totalXP = baseXP + speedBonus + accuracyBonus + comboBonus;

  useEffect(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Only award XP once per completion
    if (!hasAwardedXP.current) {
      hasAwardedXP.current = true;
      
      // Award XP immediately without waiting for step animation
      setTimeout(() => {
        addXP(baseXP, 'Order Completed');
        setShowXPBreakdown(true);
      }, 500);
      
      // Award bonus XP
      if (speedBonus > 0) {
        setTimeout(() => addXP(speedBonus, 'Speed Bonus'), 1000);
      }
      if (accuracyBonus > 0) {
        setTimeout(() => addXP(accuracyBonus, 'Perfect Accuracy'), 1500);
      }
      if (comboBonus > 0) {
        setTimeout(() => addXP(comboBonus, 'Combo Bonus'), 2000);
      }

      // Update stats - Note: ordersProcessed is only incremented when order is SHIPPED, not packed
      updateStats({
        packingTime: packingTime.time,
        packagesProcessed: 1
      });
    }
  }, []); // Empty dependency array to run only once

  const handlePrintLabel = () => {
    onPrintLabel();
    setLabelPrinted(true);
  };

  return (
    <>
      <Confetti active={showConfetti} />
      
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-lg w-full relative overflow-hidden max-h-[90vh] flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 animate-pulse" />
          
          <div className="relative z-10 overflow-y-auto flex-1">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-400 to-green-500 rounded-full mb-4 scale-in shadow-lg shadow-green-500/50">
                <Trophy className="text-white" size={40} />
              </div>
              <h2 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Run Complete! 🎉
              </h2>
              <p className="text-gray-400 text-sm">Your order is ready for shipping</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-3 text-center border border-white/10"
              >
                <Timer className="mx-auto mb-1 text-blue-400" size={20} />
                <p className="text-sm font-bold">
                  {formatTime(packingTime.time)}
                </p>
                <p className="text-xs text-gray-400">Pack Time</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-3 text-center border border-white/10"
              >
                <Award className="mx-auto mb-1 text-yellow-400" size={20} />
                <p className="text-sm font-bold">
                  {packingStats?.perfectStreak ? '✓' : '—'}
                </p>
                <p className="text-xs text-gray-400">Perfect</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-3 text-center border border-white/10"
              >
                <Sparkles className="mx-auto mb-1 text-purple-400" size={20} />
                <p className="text-sm font-bold text-blue-400">
                  <AnimatedCounter target={totalXP} duration={1500} prefix="+" suffix=" XP" />
                </p>
                <p className="text-xs text-gray-400">Earned</p>
              </motion.div>
            </div>

            {/* XP Breakdown */}
            {showXPBreakdown && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4 text-sm"
              >
                <h4 className="font-semibold text-blue-300 mb-2 flex items-center text-sm">
                  <BarChart3 className="mr-2" size={16} />
                  XP Breakdown
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <CheckCircle className="mr-1 text-gray-400" size={12} />
                      Base Completion
                    </span>
                    <span className="text-blue-400">+{baseXP} XP</span>
                  </div>
                  {speedBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center">
                        <Zap className="mr-1 text-yellow-400" size={12} />
                        Speed Bonus
                      </span>
                      <span className="text-yellow-400">+{speedBonus} XP</span>
                    </div>
                  )}
                  {accuracyBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center">
                        <Target className="mr-1 text-green-400" size={12} />
                        Perfect Accuracy
                      </span>
                      <span className="text-green-400">+{accuracyBonus} XP</span>
                    </div>
                  )}
                  {comboBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center">
                        <TrendingUp className="mr-1 text-purple-400" size={12} />
                        Combo Bonus
                      </span>
                      <span className="text-purple-400">+{comboBonus} XP</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 mb-4 space-y-3 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-medium flex items-center">
                  <Shield className="mr-2" size={14} />
                  Order ID:
                </span>
                <span className="font-bold text-white">{order.orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-medium flex items-center">
                  <Timer className="mr-2" size={14} />
                  Packing Time:
                </span>
                <span className="font-bold text-white">{formatTime(packingTime.time)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-medium flex items-center">
                  <Package className="mr-2" size={14} />
                  Package:
                </span>
                <span className="font-bold text-white">{selectedPackage.name}</span>
              </div>
              {selectedPackage.courier && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium flex items-center">
                    <Truck className="mr-2" size={14} />
                    Courier:
                  </span>
                  <span className="font-bold text-white">{selectedPackage.courier}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Edit Button */}
              <button
                onClick={onEdit}
                className="w-full py-2.5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl font-semibold hover:bg-gray-800/50 transition-all duration-300 flex items-center justify-center space-x-2 text-gray-300 hover:text-white text-sm"
              >
                <RotateCcw size={18} />
                <span>Edit Packing</span>
              </button>

              <button
                onClick={handlePrintLabel}
                className={`w-full py-3 flex items-center justify-center space-x-2 transition-all duration-300 rounded-xl font-semibold ${
                  !labelPrinted 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-blue-500/50' 
                    : 'bg-white/[0.03] backdrop-blur-xl border border-white/10 text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Package size={18} />
                <span>{labelPrinted ? 'Print Label Again' : 'Print Label'}</span>
              </button>
              
              {labelPrinted && (
                <>
                  <div className="text-center text-green-400 text-sm flex items-center justify-center space-x-2">
                    <CheckCircle size={14} />
                    <span>Label Printed Successfully</span>
                  </div>
                  <button
                    onClick={onNewOrder}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 flex items-center justify-center space-x-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 rounded-xl font-semibold"
                  >
                    <ArrowRight size={18} />
                    <span>Pack New Order</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Main Packing Component
const Packing = () => {
  const [currentScreen, setCurrentScreen] = useState('toteSelection');
  const [selectedTote, setSelectedTote] = useState(null);
  const [packingTime, setPackingTime] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [totes, setTotes] = useState(initialTotes);
  const [packingStats, setPackingStats] = useState(null);

  const handleToteSelect = (tote) => {
    setSelectedTote(tote);
    setCurrentScreen('packing');
  };

  const handlePackingComplete = (stats) => {
    setPackingTime({ time: stats.time });
    setPackingStats(stats);
    setCurrentScreen('packageSelection');
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setCurrentScreen('confirmation');
  };

  const handlePrintLabel = () => {
    console.log('Printing label for order:', selectedTote.orderId);
    
    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-1000px';
    printFrame.style.left = '-1000px';
    document.body.appendChild(printFrame);
    
    const labelHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shipping Label - ${selectedTote.orderId}</title>
        <style>
          @page {
            size: 4in 6in;
            margin: 0;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .label-container {
            border: 2px solid #000;
            padding: 20px;
            height: calc(6in - 40px);
            box-sizing: border-box;
          }
          .header {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .barcode {
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            letter-spacing: 5px;
            margin: 20px 0;
            padding: 10px;
            background: #f0f0f0;
          }
          .info-row {
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
          }
          .info-label {
            font-weight: bold;
          }
          .customer-info {
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 20px;
          }
          .items-list {
            margin-top: 20px;
            font-size: 12px;
          }
          .footer {
            position: absolute;
            bottom: 20px;
            right: 20px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <h2 style="margin: 0; text-align: center;">${selectedPackage.courier || 'SHIPPING LABEL'}</h2>
          </div>
          
          <div class="barcode">${selectedTote.orderId}</div>
          
          <div class="info-row">
            <span class="info-label">Order ID:</span>
            <span>${selectedTote.orderId}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Tote:</span>
            <span>${selectedTote.id}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Package:</span>
            <span>${selectedPackage.name}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Priority:</span>
            <span style="text-transform: uppercase; color: ${
              selectedTote.priority === 'urgent' ? 'red' : 
              selectedTote.priority === 'overnight' ? 'orange' : 'blue'
            };">${selectedTote.priority}</span>
          </div>
          
          <div class="customer-info">
            <h3 style="margin: 0 0 10px 0;">Ship To:</h3>
            <div style="font-size: 14px;">
              ${selectedTote.customer}<br>
              Auckland, New Zealand
            </div>
          </div>
          
          <div class="items-list">
            <strong>Items (${selectedTote.items.reduce((sum, item) => sum + item.quantity, 0)} total):</strong><br>
            ${selectedTote.items.map(item => 
              `${item.quantity}x ${item.name} (${item.id})`
            ).join('<br>')}
          </div>
          
          <div class="footer">
            Packed: ${new Date().toLocaleString('en-NZ')}
          </div>
        </div>
      </body>
      </html>
    `;
    
    printFrame.contentDocument.open();
    printFrame.contentDocument.write(labelHTML);
    printFrame.contentDocument.close();
    
    // Wait for content to load then print
    printFrame.onload = function() {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      
      // Remove the iframe after printing
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    };
  };

  const handleNewOrder = () => {
    setTotes(totes.filter(t => t.id !== selectedTote.id));
    setSelectedTote(null);
    setPackingTime(null);
    setSelectedPackage(null);
    setPackingStats(null);
    setCurrentScreen('toteSelection');
  };

  const handleEdit = () => {
    setCurrentScreen('packing');
  };

  return (
    <>
      <AnimatedBackground />
      <ParticleEffect active={currentScreen === 'confirmation'} />
      
      {currentScreen === 'toteSelection' && (
        <ToteSelectionScreen totes={totes} onSelectTote={handleToteSelect} />
      )}
      
      {currentScreen === 'packing' && selectedTote && (
        <PackingScreen tote={selectedTote} onComplete={handlePackingComplete} />
      )}
      
      {currentScreen === 'packageSelection' && selectedTote && (
        <PackagingSelectionScreen 
          onSelect={handlePackageSelect} 
          items={selectedTote.items}
        />
      )}
      
      {currentScreen === 'confirmation' && selectedTote && packingTime && selectedPackage && (
        <ConfirmationModal
          order={selectedTote}
          packingTime={packingTime}
          selectedPackage={selectedPackage}
          onPrintLabel={handlePrintLabel}
          onNewOrder={handleNewOrder}
          onEdit={handleEdit}
          packingStats={packingStats}
        />
      )}
    </>
  );
};

export default Packing;