import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Truck, Clock, History, RefreshCw, Plus, Minus, Edit } from 'lucide-react';
import GameIcon from './GameIcon';
import { useWarehouse } from '../hooks/useWarehouseContext';

const StockDetailPanel = ({ selectedItem, onQuantityAdjust, onViewHistory, onRequestRestock }) => {
  const { playSound, addXP } = useWarehouse();
  const [adjustmentMode, setAdjustmentMode] = useState(false);
  const [adjustmentValue, setAdjustmentValue] = useState(0);

  if (!selectedItem) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex flex-col items-center justify-center text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <GameIcon
            iconType="package"
            size={120}
            tier="common"
            quantity={0}
            animated={true}
          />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-400 mt-6 mb-2">Select an Item</h2>
        <p className="text-gray-500">Choose an item from the list to view details</p>
      </motion.div>
    );
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get stock level info
  const getStockInfo = (quantity) => {
    if (quantity === 0) return { level: 'Out of Stock', color: 'text-red-400', tier: 'epic' };
    if (quantity <= 20) return { level: 'Low Stock', color: 'text-orange-400', tier: 'rare' };
    if (quantity <= 100) return { level: 'In Stock', color: 'text-green-400', tier: 'common' };
    return { level: 'Well Stocked', color: 'text-blue-400', tier: 'legendary' };
  };

  const stockInfo = getStockInfo(selectedItem.quantity);

  const handleAdjustQuantity = () => {
    if (adjustmentValue !== 0) {
      const newQuantity = Math.max(0, selectedItem.quantity + adjustmentValue);
      onQuantityAdjust(selectedItem, newQuantity);
      setAdjustmentMode(false);
      setAdjustmentValue(0);
      playSound('success');
      addXP(15, 'Stock Adjusted');
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedItem.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full flex flex-col"
      >
        {/* Header Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="flex justify-center mb-6"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <GameIcon
              iconType={selectedItem.icon}
              size={120}
              tier={stockInfo.tier}
              quantity={selectedItem.quantity}
              animated={true}
            />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-2">{selectedItem.name}</h1>
          <p className="text-lg text-gray-400 font-mono">{selectedItem.id}</p>
          
          {/* Stock Level Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className={`inline-block px-4 py-2 rounded-full border mt-4 ${
              selectedItem.quantity === 0
                ? 'bg-red-500/20 border-red-500/30 text-red-400'
                : selectedItem.quantity <= 20
                ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                : 'bg-green-500/20 border-green-500/30 text-green-400'
            }`}
          >
            {stockInfo.level}
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Quantity */}
          <motion.div
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <GameIcon iconType="package" size={24} tier="common" animated={true} />
                <span className="text-gray-400">Current Quantity</span>
              </div>
              <span className="text-2xl font-bold text-white">{selectedItem.quantity}</span>
            </div>
          </motion.div>

          {/* Location */}
          <motion.div
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="flex items-center space-x-3">
              <MapPin size={20} className="text-blue-400" />
              <div>
                <span className="text-gray-400 text-sm">Location</span>
                <p className="text-white font-medium">{selectedItem.location}</p>
              </div>
            </div>
          </motion.div>

          {/* Supplier */}
          <motion.div
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="flex items-center space-x-3">
              <Truck size={20} className="text-green-400" />
              <div>
                <span className="text-gray-400 text-sm">Supplier</span>
                <p className="text-white font-medium">{selectedItem.supplier}</p>
              </div>
            </div>
          </motion.div>

          {/* Last Updated */}
          <motion.div
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="flex items-center space-x-3">
              <Clock size={20} className="text-purple-400" />
              <div>
                <span className="text-gray-400 text-sm">Last Updated</span>
                <p className="text-white font-medium">{formatDate(selectedItem.lastUpdated)}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Quantity Adjustment */}
        <AnimatePresence>
          {adjustmentMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/[0.05] border border-white/10 rounded-2xl p-6 mb-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Adjust Quantity</h3>
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setAdjustmentValue(prev => prev - 1);
                    playSound('click');
                  }}
                  className="p-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 transition-all"
                >
                  <Minus size={20} />
                </motion.button>
                
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-white">
                    {selectedItem.quantity} {adjustmentValue !== 0 && (
                      <span className={adjustmentValue > 0 ? 'text-green-400' : 'text-red-400'}>
                        {adjustmentValue > 0 ? '+' : ''}{adjustmentValue}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    New: {Math.max(0, selectedItem.quantity + adjustmentValue)}
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setAdjustmentValue(prev => prev + 1);
                    playSound('click');
                  }}
                  className="p-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/30 transition-all"
                >
                  <Plus size={20} />
                </motion.button>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdjustQuantity}
                  disabled={adjustmentValue === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Changes
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAdjustmentMode(false);
                    setAdjustmentValue(0);
                    playSound('click');
                  }}
                  className="px-6 py-3 bg-white/[0.05] border border-white/10 text-white rounded-xl font-medium hover:bg-white/[0.1]"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions Section */}
        <motion.div
          className="space-y-3 mt-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => playSound('hover')}
            onClick={() => {
              setAdjustmentMode(!adjustmentMode);
              playSound('click');
            }}
            className="w-full flex items-center justify-center px-6 py-4 rounded-2xl font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
          >
            <Edit size={20} />
            <span className="ml-3">Adjust Quantity</span>
          </motion.button>
          
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => playSound('hover')}
              onClick={() => onViewHistory(selectedItem)}
              className="flex items-center justify-center px-4 py-3 rounded-2xl font-medium bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white transition-all duration-300"
            >
              <History size={18} />
              <span className="ml-2">History</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => playSound('hover')}
              onClick={() => onRequestRestock(selectedItem)}
              className="flex items-center justify-center px-4 py-3 rounded-2xl font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300"
            >
              <RefreshCw size={18} />
              <span className="ml-2">Restock</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StockDetailPanel; 