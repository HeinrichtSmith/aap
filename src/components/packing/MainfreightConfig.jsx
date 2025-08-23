import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, AlertCircle, Plus } from 'lucide-react';
import { playSound } from '../../utils/audio';
import GameIcon from '../GameIcon';

const MainfreightConfig = ({ onAdd }) => {
  const [customType, setCustomType] = useState('pallet');
  const [customDimensions, setCustomDimensions] = useState({ length: '', width: '', height: '' });
  const [customDescription, setCustomDescription] = useState('');
  const [palletWeight, setPalletWeight] = useState('');
  const [dimensionError, setDimensionError] = useState('');
  const [weightError, setWeightError] = useState('');

  const handleSubmit = () => {
    // Validate custom configuration
    if (!customDescription.trim()) {
      setDimensionError('Please provide a description');
      playSound('error');
      return;
    }

    if (!customDimensions.length || !customDimensions.width || !customDimensions.height) {
      setDimensionError('All dimensions are required');
      playSound('error');
      return;
    }

    const dims = [customDimensions.length, customDimensions.width, customDimensions.height];
    for (let dim of dims) {
      const val = parseFloat(dim);
      if (isNaN(val) || val <= 0) {
        setDimensionError('Please enter valid dimensions in meters');
        playSound('error');
        return;
      }
      if (val > 10) {
        setDimensionError('Dimensions cannot exceed 10 meters');
        playSound('error');
        return;
      }
    }

    if (!palletWeight) {
      setWeightError('Weight is required for mainfreight');
      playSound('error');
      return;
    }

    const weight = parseFloat(palletWeight);
    if (isNaN(weight) || weight <= 0) {
      setWeightError('Please enter a valid weight in kg');
      playSound('error');
      return;
    }
    if (weight > 1000) {
      setWeightError('Weight cannot exceed 1000kg');
      playSound('error');
      return;
    }

    // Create a unique ID for this custom configuration
    const customId = `custom-${customType}-${Date.now()}`;
    
    // Create custom package data
    const customPackage = {
      id: customId,
      name: `Custom ${customType === 'pallet' ? 'Pallet' : customType === 'carton' ? 'Carton' : 'Item'}: ${customDescription}`,
      dimensions: `${customDimensions.length}×${customDimensions.width}×${customDimensions.height}m`,
      iconType: customType === 'pallet' ? 'pallet' : customType === 'carton' ? 'carton' : 'largeItem',
      iconCount: 1,
      iconSize: 'large',
      isCustom: true,
      requiresWeight: true,
      weight: weight,
      customType,
      customDimensions,
      customDescription
    };

    // Add to shipment
    onAdd(customPackage);

    // Reset form
    setCustomDescription('');
    setCustomDimensions({ length: '', width: '', height: '' });
    setPalletWeight('');
    setWeightError('');
    setDimensionError('');
    
    playSound('success');
  };

  return (
    <motion.div 
      key="mainfreight-config"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6">
        <h4 className="font-semibold text-purple-300 mb-4 text-lg flex items-center">
          <Layers className="mr-2" size={20} />
          Freight Configuration
        </h4>
        
        {/* Pallet Type Selection */}
        <div className="mb-6">
          <p className="text-gray-400 mb-3 text-sm">Select shipment type:</p>
          <div className="grid grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCustomType('pallet');
                playSound('click');
              }}
              className={`p-4 rounded-xl border transition-colors duration-150 ${
                customType === 'pallet'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/30'
              }`}
            >
              <div className="flex justify-center mb-2">
                <GameIcon iconType="pallet" iconCount={1} iconSize="large" size={60} />
              </div>
              <div className="font-semibold">Palletized Goods</div>
              <div className="text-xs mt-1 opacity-80">Standard freight on pallet</div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCustomType('carton');
                playSound('click');
              }}
              className={`p-4 rounded-xl border transition-colors duration-150 ${
                customType === 'carton'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/30'
              }`}
            >
              <div className="flex justify-center mb-2">
                <GameIcon iconType="carton" iconCount={1} iconSize="large" size={60} />
              </div>
              <div className="font-semibold">Carton</div>
              <div className="text-xs mt-1 opacity-80">Large box shipment</div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCustomType('item');
                playSound('click');
              }}
              className={`p-4 rounded-xl border transition-colors duration-150 ${
                customType === 'item'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/30'
              }`}
            >
              <div className="flex justify-center mb-2">
                <GameIcon iconType="largeItem" iconCount={1} iconSize="large" size={60} />
              </div>
              <div className="font-semibold">Large Item</div>
              <div className="text-xs mt-1 opacity-80">Oversized or irregular freight</div>
            </motion.button>
          </div>
        </div>
        
        {/* Description Input */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">
            Description <span className="text-purple-400">*</span>
          </label>
          <input
            type="text"
            value={customDescription}
            onChange={(e) => {
              setCustomDescription(e.target.value);
              setDimensionError('');
            }}
            placeholder={`Describe the ${customType} contents`}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all"
            maxLength="50"
          />
        </div>
        
        {/* Dimensions and Weight Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Dimensions Section */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              Dimensions (meters) <span className="text-purple-400">*</span>
            </label>
            <div className="space-y-3">
              <div>
                <input
                  type="number"
                  value={customDimensions.length}
                  onChange={(e) => {
                    setCustomDimensions({ ...customDimensions, length: e.target.value });
                    setDimensionError('');
                  }}
                  placeholder="2.40"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all"
                  step="0.01"
                  min="0.01"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">Length (m)</p>
              </div>
              <div>
                <input
                  type="number"
                  value={customDimensions.width}
                  onChange={(e) => {
                    setCustomDimensions({ ...customDimensions, width: e.target.value });
                    setDimensionError('');
                  }}
                  placeholder="1.20"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all"
                  step="0.01"
                  min="0.01"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">Width (m)</p>
              </div>
              <div>
                <input
                  type="number"
                  value={customDimensions.height}
                  onChange={(e) => {
                    setCustomDimensions({ ...customDimensions, height: e.target.value });
                    setDimensionError('');
                  }}
                  placeholder="1.80"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all"
                  step="0.01"
                  min="0.01"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">Height (m)</p>
              </div>
            </div>
          </div>
          
          {/* Weight Section */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              Weight <span className="text-orange-400">*</span>
            </label>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <p className="text-xs text-orange-300 mb-3">
                Required for Mainfreight
              </p>
              <div className="relative">
                <input
                  type="number"
                  value={palletWeight}
                  onChange={(e) => {
                    setPalletWeight(e.target.value);
                    setWeightError('');
                  }}
                  placeholder="Enter weight..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-orange-500/50 focus:outline-none transition-all"
                  step="0.1"
                  min="0"
                  max="1000"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                  kg
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Total weight including pallet
              </p>
            </div>
          </div>
        </div>
        
        {/* Error Messages */}
        {dimensionError && (
          <div className="mt-4 text-red-400 text-sm flex items-center">
            <AlertCircle className="mr-2" size={16} />
            {dimensionError}
          </div>
        )}
        
        {weightError && (
          <div className="mt-4 text-red-400 text-sm flex items-center">
            <AlertCircle className="mr-2" size={16} />
            {weightError}
          </div>
        )}

        {/* Add to Shipment Button */}
        <div className="mt-6 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center"
          >
            <Plus className="mr-2" size={20} />
            Add to Shipment
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MainfreightConfig; 