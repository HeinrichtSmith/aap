import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Timer, Award, Sparkles, CheckCircle, 
  BarChart3, Zap, Target, TrendingUp, RotateCcw,
  Barcode, Package, Truck, ArrowRight, Box, Hash, Layers,
  X, Printer, Home
} from 'lucide-react';
import AnimatedCounter from '../AnimatedCounter';
import GameIcon from '../GameIcon';
import { playSound } from '../../utils/audio';
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

const ConfirmationScreen = ({ order, packingTime, selectedPackage, onPrintLabel, onNewOrder, onEdit, packingStats, onClose }) => {
  const { addXP, updateStats } = useWarehouse();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasPrinted, setHasPrinted] = useState(false);
  const [showXPBreakdown, setShowXPBreakdown] = useState(false);
  const hasAwardedXP = useRef(false);

  // Enhanced XP calculation with quantity bonus
  const baseXP = 50;
  const speedBonus = packingTime.time < 60 ? 25 : packingTime.time < 120 ? 15 : 0;
  const accuracyBonus = packingStats?.perfectStreak ? 30 : 0;
  const comboBonus = Math.min(packingStats?.combo || 0, 20) * 2;
  const quantityBonus = selectedPackage.quantity > 1 ? (selectedPackage.quantity - 1) * 10 : 0;
  const totalXP = baseXP + speedBonus + accuracyBonus + comboBonus + quantityBonus;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => prev < 2 ? prev + 1 : prev);
    }, 800);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Only award XP once per completion
    if (!hasAwardedXP.current) {
      hasAwardedXP.current = true;
      
      // Award XP with delays
      setTimeout(() => {
        addXP(baseXP, 'Order Completed');
        setShowXPBreakdown(true);
      }, 500);
      
      if (speedBonus > 0) {
        setTimeout(() => addXP(speedBonus, 'Speed Bonus'), 1000);
      }
      if (accuracyBonus > 0) {
        setTimeout(() => addXP(accuracyBonus, 'Perfect Accuracy'), 1500);
      }
      if (comboBonus > 0) {
        setTimeout(() => addXP(comboBonus, 'Combo Bonus'), 2000);
      }
      if (quantityBonus > 0) {
        setTimeout(() => addXP(quantityBonus, 'Multi-Package Bonus'), 2500);
      }

      // Update stats
      updateStats({
        ordersProcessed: (order.stats?.ordersProcessed || 0) + 1,
        packingTime: packingTime.time,
        packagesProcessed: selectedPackage.quantity || 1
      });
    }
  }, []);

  const handlePrintAndContinue = () => {
    setIsPrinting(true);
    
    // Simulate printing process
    setTimeout(() => {
      onPrintLabel();
      setIsPrinting(false);
      setHasPrinted(true);
      playSound('success');
      
      // Auto-proceed after short delay to show success
      setTimeout(() => {
        onNewOrder();
      }, 1000);
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
          
          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => {
              playSound('click');
              onClose();
            }}
            onMouseEnter={() => playSound('hover')}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors z-20"
          >
            <X size={20} />
          </motion.button>
          
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
              Pack Complete! 🎉
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 mb-8"
            >
              Order {order.orderId} successfully packed and ready for shipping
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
                  {currentStep >= 1 ? formatTime(packingTime.time) : '0:00'}
                </p>
                <p className="text-sm text-gray-400">Pack Time</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-800/50 rounded-xl p-6"
              >
                <div className="flex justify-center mb-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.7, 
                      type: "spring", 
                      stiffness: 200,
                      damping: 15
                    }}
                  >
                    <GameIcon
                      iconType={selectedPackage.iconType || 'box'}
                      actualQuantity={selectedPackage.quantity || 1}
                      size={40}
                      iconSize="medium"
                    />
                  </motion.div>
                </div>
                <p className="text-3xl font-bold">
                  {currentStep >= 2 ? <AnimatedCounter target={selectedPackage.quantity || 1} duration={1000} /> : '0'}
                </p>
                <p className="text-sm text-gray-400">Packages</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gray-800/50 rounded-xl p-6"
              >
                <Sparkles className="mx-auto mb-3 text-purple-400" size={32} />
                <p className="text-3xl font-bold text-blue-400">
                  <AnimatedCounter target={totalXP} duration={1500} prefix="+" suffix=" XP" />
                </p>
                <p className="text-sm text-gray-400">Earned</p>
              </motion.div>
            </div>

            {/* XP Breakdown */}
            {showXPBreakdown && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8"
              >
                <h4 className="font-semibold text-blue-300 mb-4 flex items-center justify-center">
                  <BarChart3 className="mr-2" size={20} />
                  XP Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <CheckCircle className="mr-2 text-gray-400" size={16} />
                      Base Completion
                    </span>
                    <span className="text-blue-400 font-bold">+{baseXP}</span>
                  </div>
                  {speedBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center">
                        <Zap className="mr-2 text-yellow-400" size={16} />
                        Speed Bonus
                      </span>
                      <span className="text-yellow-400 font-bold">+{speedBonus}</span>
                    </div>
                  )}
                  {accuracyBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center">
                        <Target className="mr-2 text-green-400" size={16} />
                        Perfect Accuracy
                      </span>
                      <span className="text-green-400 font-bold">+{accuracyBonus}</span>
                    </div>
                  )}
                  {comboBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center">
                        <TrendingUp className="mr-2 text-purple-400" size={16} />
                        Combo Bonus
                      </span>
                      <span className="text-purple-400 font-bold">+{comboBonus}</span>
                    </div>
                  )}
                  {quantityBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center">
                        <Layers className="mr-2 text-orange-400" size={16} />
                        Multi-Package Bonus
                      </span>
                      <span className="text-orange-400 font-bold">+{quantityBonus}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Package Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-gray-800/30 rounded-xl p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Package Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order:</span>
                  <span className="font-bold text-white">{order.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Package:</span>
                  <span className="font-bold text-white">
                    {selectedPackage.quantity > 1 && (
                      <span className="text-blue-400 mr-1">{selectedPackage.quantity} ×</span>
                    )}
                    {selectedPackage.isCustom && selectedPackage.customType 
                      ? (selectedPackage.customType === 'pallet' ? 'Pallet' : selectedPackage.customType === 'carton' ? 'Carton' : 'Item')
                      : selectedPackage.name}
                  </span>
                </div>
                {selectedPackage.courier && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Courier:</span>
                    <span className="font-bold text-white">{selectedPackage.courier}</span>
                  </div>
                )}
                {selectedPackage.weight && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Weight:</span>
                    <span className="font-bold text-white">{selectedPackage.weight} kg</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Action Buttons */}
            {!hasPrinted ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
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
                  transition={{ delay: 1.1 }}
                  whileHover={!isPrinting ? { scale: 1.05 } : {}}
                  whileTap={!isPrinting ? { scale: 0.95 } : {}}
                  onClick={() => {
                    playSound('click');
                    handlePrintAndContinue();
                  }}
                  onMouseEnter={() => !isPrinting && playSound('hover')}
                  disabled={isPrinting}
                  className={`py-3 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                    isPrinting 
                      ? 'bg-gray-600 cursor-not-allowed' 
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
                  ) : (
                    <>
                      <Printer size={18} />
                      <span>Print & Continue</span>
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    playSound('click');
                    handleBackToDashboard();
                  }}
                  onMouseEnter={() => playSound('hover')}
                  className="py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Home size={18} />
                  <span>Dashboard</span>
                </motion.button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <span className="text-green-400 font-medium">Proceeding to next order...</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default ConfirmationScreen;