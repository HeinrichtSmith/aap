import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Timer, Award, Sparkles, CheckCircle, 
  BarChart3, Zap, Target, TrendingUp, RotateCcw,
  Barcode, Package, Truck, ArrowRight, Box, Hash, Layers,
  X, Printer, Home, Navigation, MapPin, Lock
} from 'lucide-react';
import AnimatedCounter from '../AnimatedCounter';
import GameIcon from '../GameIcon';
import { playSound } from '../../utils/audio';
import { getItemIconType } from '../../config/gameIconConstants';
import { formatTime } from '../../utils/formatters';
import { useWarehouse } from '../../hooks/useWarehouseContext';
import { useNavigate } from 'react-router-dom';

// Simple confetti for achievements
const Confetti = ({ active }) => {
  if (!active) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][i % 5],
            left: `${Math.random() * 100}%`,
            top: '-10px'
          }}
          initial={{ y: -10, opacity: 1 }}
          animate={{ 
            y: window.innerHeight + 10, 
            opacity: 0, 
            x: (Math.random() - 0.5) * 100
          }}
          transition={{
            duration: Math.random() * 1.5 + 1.5,
            delay: Math.random() * 0.5,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

const PickingConfirmation = ({ order, pickingTime, onPrintList, onConfirm, onContinue, onEdit, pickingStats, onClose, pickedItems = [] }) => {
  const { updateStats } = useWarehouse();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasPrinted, setHasPrinted] = useState(false);
  const hasUpdatedStats = useRef(false);

  // Calculate total items picked
  const totalItemsPicked = order.items.reduce((sum, item) => sum + item.quantity, 0);

  // Function to get actual picked quantity for an item
  const getPickedQuantity = (itemId) => {
    return pickedItems.filter(id => id === itemId).length;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => prev < 2 ? prev + 1 : prev);
    }, 800);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Only update stats once per completion
    if (!hasUpdatedStats.current) {
      hasUpdatedStats.current = true;

      // Update stats - Note: ordersProcessed is only incremented when order is SHIPPED, not picked
      updateStats({
        ordersPicked: 1,
        itemsPicked: totalItemsPicked,
        pickingTime: pickingTime.time
      });
    }
  }, []);

  const handlePrintAndConfirm = () => {
    setIsPrinting(true);
    
    // Simulate printing process
    setTimeout(() => {
      onPrintList();
      onConfirm(); // Confirm the order and add to packing station immediately
      setIsPrinting(false);
      setHasPrinted(true);
      playSound('success');
    }, 2000);
  };

  const handleBackToDashboard = () => {
    playSound('transition');
    navigate('/dashboard');
  };

  return (
    <>
      <Confetti active={true} />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="bg-gray-900/95 backdrop-blur-xl p-8 rounded-3xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto text-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl" />
          
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center"
            >
              <CheckCircle size={40} className="text-white" />
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-2"
            >
              Picking Complete! 🎯
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 mb-8"
            >
              Order {order.orderId} has been successfully picked from the warehouse
            </motion.p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-800/50 rounded-xl p-6"
              >
                <Timer className="mx-auto mb-3 text-blue-400" size={32} />
                <p className="text-3xl font-bold">
                  {currentStep >= 1 ? formatTime(pickingTime.time) : '0:00'}
                </p>
                <p className="text-sm text-gray-400">Pick Time</p>
                {pickingTime.time < order.estimatedTime && (
                  <p className="text-xs text-green-400 mt-1">
                    -{formatTime(order.estimatedTime - pickingTime.time)} faster!
                  </p>
                )}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-800/50 rounded-xl p-6"
              >
                <Package className="mx-auto mb-3 text-purple-400" size={32} />
                <p className="text-3xl font-bold">
                  {currentStep >= 2 ? <AnimatedCounter target={totalItemsPicked} duration={1000} /> : '0'}
                </p>
                <p className="text-sm text-gray-400">Items Picked</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gray-800/50 rounded-xl p-6"
              >
                <CheckCircle className="mx-auto mb-3 text-green-400" size={32} />
                <p className="text-3xl font-bold text-green-400">
                  Complete
                </p>
                <p className="text-sm text-gray-400">Order Picked</p>
              </motion.div>
            </div>

            {/* Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gray-800/30 rounded-xl p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <Target className="mx-auto mb-2 text-green-400" size={24} />
                  <p className="text-2xl font-bold text-white">{pickingStats?.accuracy || 100}%</p>
                  <p className="text-gray-400">Accuracy</p>
                </div>
                <div className="text-center">
                  <Zap className="mx-auto mb-2 text-yellow-400" size={24} />
                  <p className="text-2xl font-bold text-white">{pickingStats?.combo || 0}x</p>
                  <p className="text-gray-400">Max Combo</p>
                </div>
                <div className="text-center">
                  <Navigation className="mx-auto mb-2 text-blue-400" size={24} />
                  <p className="text-2xl font-bold text-white">{order.items.length}</p>
                  <p className="text-gray-400">Locations</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="mx-auto mb-2 text-purple-400" size={24} />
                  <p className="text-2xl font-bold text-white">
                    {pickingTime.time && pickingTime.time > 0 ? Math.round((totalItemsPicked / pickingTime.time) * 60) : 0}
                  </p>
                  <p className="text-gray-400">Items/Min</p>
                </div>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-gray-800/30 rounded-xl p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm max-h-48 overflow-y-auto">
                {order.items.map((item, index) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                    <div className="flex items-center space-x-3">
                      <GameIcon
                        iconType={getItemIconType(item.name, item.sku || item.id)}
                        size={24}
                        iconSize="small"
                        actualQuantity={getPickedQuantity(item.id)}
                      />
                      <div className="text-left">
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const pickedQty = getPickedQuantity(item.id);
                        const orderedQty = item.quantity;
                        const isFullyPicked = pickedQty >= orderedQty;
                        
                        return (
                          <span className={`font-bold ${isFullyPicked ? 'text-green-400' : 'text-yellow-400'}`}>
                            {isFullyPicked ? '✓' : '⚠'} {pickedQty}/{orderedQty}
                          </span>
                        );
                      })()}
                      <p className="text-xs text-gray-400">{item.binLocation}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                <span className="text-gray-400">Total Items:</span>
                <span className="text-xl font-bold text-white">{totalItemsPicked}</span>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  playSound('click');
                  onEdit();
                }}
                onMouseEnter={() => playSound('hover')}
                className="py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <RotateCcw size={18} />
                <span>Edit</span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                whileHover={!isPrinting ? { scale: 1.05 } : {}}
                whileTap={!isPrinting ? { scale: 0.95 } : {}}
                onClick={() => {
                  if (hasPrinted) {
                    playSound('click');
                    onContinue(); // Just proceed to next order (already confirmed)
                  } else {
                    playSound('click');
                    handlePrintAndConfirm();
                  }
                }}
                onMouseEnter={() => !isPrinting && playSound('hover')}
                disabled={isPrinting}
                className={`py-3 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                  isPrinting 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : hasPrinted
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/25'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg hover:shadow-blue-500/25'
                }`}
              >
                {isPrinting ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Printer size={18} />
                    </motion.div>
                    <span>Printing...</span>
                  </>
                ) : hasPrinted ? (
                  <>
                    <ArrowRight size={18} />
                    <span>Continue</span>
                  </>
                ) : (
                  <>
                    <Printer size={18} />
                    <span>Print</span>
                  </>
                )}
              </motion.button>
              
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                whileHover={!hasPrinted ? {} : { scale: 1.05 }}
                whileTap={!hasPrinted ? {} : { scale: 0.95 }}
                onClick={() => {
                  if (hasPrinted) {
                    playSound('click');
                    handleBackToDashboard();
                  } else {
                    playSound('error');
                  }
                }}
                onMouseEnter={() => hasPrinted ? playSound('hover') : playSound('error')}
                disabled={!hasPrinted}
                className={`py-3 font-medium rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                  hasPrinted
                    ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                    : 'bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-700'
                }`}
                title={!hasPrinted ? 'Please print the order before going to dashboard' : ''}
              >
                <Home size={18} className={hasPrinted ? '' : 'opacity-50'} />
                <span>Dashboard</span>
                {!hasPrinted && <Lock size={14} className="ml-1 opacity-50" />}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default PickingConfirmation;