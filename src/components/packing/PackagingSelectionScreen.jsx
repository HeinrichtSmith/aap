// src/components/packing/PackagingSelectionScreen.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Timer, CheckCircle, AlertCircle, ShoppingBag, 
  Truck, PackageCheck, ShoppingCart, Barcode, Calendar,
  Info, Layers, Package, Sparkles, Plus, Minus, Hash, Edit2, Lock
} from 'lucide-react';
import AnimatedBackground from '../AnimatedBackground';
import PackageRecommendation from './PackageRecommendation';
import ShipmentSummary from './ShipmentSummary.jsx';
import GameIcon from '../GameIcon';
import BackButton from '../BackButton';
import { playSound } from '../../utils/audio';
import { formatTime } from '../../utils/formatters';
import { boxOptions, courierBagOptions, palletOptions } from '../../data/packingData';
import { usePackageManagement } from '../../hooks/usePackageManagement';
import { getItemIconType } from '../../config/gameIconConstants';
import PackageGrid from './PackageGrid';
import MainfreightConfig from './MainfreightConfig';

const MAX_QUANTITY = 300; // Increased from 50 to 300 to see cosmic tier

const PackagingSelectionScreen = ({ onSelect, items = [], packingTime, startTime, tote, onBack }) => {
  const [selectedType, setSelectedType] = useState('boxes');
  const [currentTime, setCurrentTime] = useState(packingTime?.time || 0);
  const [showSummary, setShowSummary] = useState(false);
  const [allPackageOptions, setAllPackageOptions] = useState([...boxOptions, ...courierBagOptions, ...palletOptions]);
  const [showWarning, setShowWarning] = useState(null); // Track which tab triggered warning

  const {
    shipment,
    addToShipment,
    removeFromShipment,
    updateShipmentQuantity,
    removeItemFromShipment,
    getTotalPackages
  } = usePackageManagement();

  // Continue the timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setCurrentTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Auto-open summary when items are added
  useEffect(() => {
    if (Object.keys(shipment).length > 0 && !showSummary) {
      setShowSummary(true);
    }
  }, [shipment, showSummary]);

  // Helper functions to determine courier company types
  const getCourierType = (packageOption) => {
    if (boxOptions.includes(packageOption) || courierBagOptions.includes(packageOption)) {
      return 'nz-couriers';
    }
    if (palletOptions.includes(packageOption) || packageOption.isCustom) {
      return 'mainfreight';
    }
    return 'unknown';
  };

  const getShipmentCourierTypes = () => {
    const packageIds = Object.keys(shipment);
    const courierTypes = new Set();
    
    packageIds.forEach(packageId => {
      const packageOption = allPackageOptions.find(opt => opt.id === packageId);
      if (packageOption) {
        courierTypes.add(getCourierType(packageOption));
      }
    });
    
    return Array.from(courierTypes);
  };

  const canAccessTab = (tabType) => {
    const shipmentCourierTypes = getShipmentCourierTypes();
    
    // If shipment is empty, all tabs are accessible
    if (shipmentCourierTypes.length === 0) return true;
    
    // If shipment has mixed types (shouldn't happen but defensive), block everything
    if (shipmentCourierTypes.length > 1) return false;
    
    const currentCourierType = shipmentCourierTypes[0];
    
    if (tabType === 'mainfreight') {
      // Can access Mainfreight if shipment is empty or only has Mainfreight
      return currentCourierType === 'mainfreight';
    } else {
      // Can access boxes/satchels if shipment is empty or only has NZ Couriers
      return currentCourierType === 'nz-couriers';
    }
  };

  const getTabDisabledMessage = (tabType) => {
    const shipmentCourierTypes = getShipmentCourierTypes();
    if (shipmentCourierTypes.length === 0) return null;
    
    if (tabType === 'mainfreight' && shipmentCourierTypes.includes('nz-couriers')) {
      return 'Cannot mix Mainfreight with NZ Couriers packages';
    }
    if ((tabType === 'boxes' || tabType === 'satchels') && shipmentCourierTypes.includes('mainfreight')) {
      return 'Cannot mix NZ Couriers with Mainfreight packages';
    }
    return null;
  };

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
    else return 'pallet-small';
  };

  const recommendedId = getRecommendedId();
  
  const getRecommendedTab = () => {
    if (boxOptions.some(opt => opt.id === recommendedId)) return 'boxes';
    if (courierBagOptions.some(opt => opt.id === recommendedId)) return 'satchels';
    if (palletOptions.some(opt => opt.id === recommendedId)) return 'mainfreight';
    return 'boxes';
  };
  
  const recommendedTab = getRecommendedTab();

  const handleMainfreightAdd = (customPackage) => {
    setAllPackageOptions(prev => [...prev, customPackage]);
    addToShipment(customPackage.id);
  };

  const handleTabClick = (tabType) => {
    if (!canAccessTab(tabType)) {
      playSound('error');
      setShowWarning(tabType);
      // Hide warning after 3 seconds
      setTimeout(() => setShowWarning(null), 3000);
      return;
    }
    setSelectedType(tabType);
    playSound('click');
    setShowWarning(null); // Clear any existing warnings
  };

  const handleConfirmPackaging = () => {
    if (Object.keys(shipment).length === 0) {
      playSound('error');
      return;
    }

    // Calculate final time
    const finalTime = currentTime;
    
    // Transform shipment object into array format for onSelect
    const packagesList = Object.entries(shipment).map(([packageId, quantity]) => {
      const packageData = allPackageOptions.find(pkg => pkg.id === packageId);
      return {
        ...packageData,
        quantity
      };
    });
    
    onSelect(packagesList, finalTime);
    playSound('complete');
  };

  const getTabIcon = (type) => {
    switch(type) {
      case 'boxes': return <Box size={16} />;
      case 'satchels': return <ShoppingBag size={16} />;
      case 'mainfreight': return <Truck size={16} />;
      default: return null;
    }
  };

  const totalPackages = getTotalPackages();

  return (
    <div className="min-h-screen w-full p-8 overflow-auto relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-[1800px] mx-auto relative z-10">
        <BackButton 
          className="mb-8" 
          onClick={onBack}
          text="Back to Packing"
        />
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <GameIcon iconType="box" actualQuantity={totalPackages || 1} size={60} iconSize="medium" />
            <h1 className="text-6xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent ml-4">
              Select Packaging
            </h1>
          </div>
          <p className="text-xl text-gray-400 flex items-center justify-center">
            <PackageCheck className="mr-2" size={20} />
            Build your shipment by selecting multiple package types
          </p>
        </div>

        {/* Timer and Order Details display */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-6">
              {/* Timer */}
              <div className="flex items-center space-x-3">
                <Timer className="text-blue-400" size={20} />
                <div className="text-2xl font-mono bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                  {formatTime(currentTime)}
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-700"></div>

              {/* Order Details */}
              {tote && (
                <>
                  <div className="flex items-center space-x-2">
                    <Barcode className="text-gray-500" size={16} />
                    <span className="text-sm text-gray-500">Order:</span>
                    <span className="text-sm font-bold text-gray-300">{tote.orderId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="text-gray-500" size={16} />
                    <span className="text-sm text-gray-500">Picked:</span>
                    <span className="text-sm font-bold text-gray-300">
                      {new Date(tote.pickedDate).toLocaleDateString('en-NZ')}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Packed Items Overview - PRIORITY SECTION */}
        {items.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border-2 border-green-500/30 shadow-xl shadow-green-500/10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-bold text-white flex items-center">
                  <Package className="mr-4 text-green-400" size={36} />
                  Items You Packed
                </h2>
                <div className="flex items-center space-x-3 bg-green-500/20 border border-green-500/40 px-6 py-3 rounded-2xl">
                  <GameIcon iconType="box" actualQuantity={items.reduce((sum, item) => sum + item.quantity, 0)} size={48} iconSize="medium" />
                  <span className="text-green-400 font-bold text-lg">
                    {items.reduce((sum, item) => sum + item.quantity, 0)} total items
                  </span>
                </div>
              </div>

              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white text-lg truncate">{item.name}</h3>
                      <div className="flex items-center space-x-2">
                        <GameIcon iconType={getItemIconType(item.name, item.sku || item.id)} actualQuantity={item.quantity} size={48} iconSize="medium" />
                        <div className="bg-green-500/30 text-green-300 px-3 py-1 rounded-full text-lg font-bold">
                          ×{item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center">
                        <Barcode className="mr-2" size={16} />
                        <span className="font-mono">{item.id}</span>
                      </div>
                      {item.binLocation && (
                        <div className="flex items-center">
                          <Box className="mr-2" size={16} />
                          <span className="font-medium">Bin: {(() => {
                            // Convert bin location format to simple zone + number
                            const binId = item.binLocation;
                            const [zone, row] = binId.split('-');
                            
                            // Remove leading zeros and use row as the bin number
                            const binNumber = parseInt(row);
                            
                            return `${zone}${binNumber}`;
                          })()}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-gray-300 text-lg">
                  💡 <span className="font-semibold">Choose your packaging based on these items</span>
                </p>
              </div>
            </div>
          </div>
        )}



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Selection Area */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-8 relative overflow-hidden border border-white/10">
              <div className="relative">
                <div className="flex justify-center space-x-4 mb-10">
                  <div className="relative">
                    <button
                      onClick={() => handleTabClick('boxes')}
                      onMouseEnter={() => canAccessTab('boxes') && playSound('hover')}
                      disabled={!canAccessTab('boxes')}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 relative flex items-center ${
                        !canAccessTab('boxes')
                          ? 'text-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50'
                          : selectedType === 'boxes' 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                            : 'text-gray-400 hover:text-white bg-white/5'
                      }`}
                      title={getTabDisabledMessage('boxes')}
                    >
                      {getTabIcon('boxes')}
                      <span className="ml-2">Boxes</span>
                      {!canAccessTab('boxes') && (
                        <Lock className="ml-2 text-red-500" size={14} />
                      )}
                      {selectedType !== 'boxes' && recommendedTab === 'boxes' && canAccessTab('boxes') && (
                        <motion.div 
                          className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            filter: [
                              "drop-shadow(0 0 0px rgba(59, 130, 246, 0.7))",
                              "drop-shadow(0 0 15px rgba(59, 130, 246, 1))",
                              "drop-shadow(0 0 0px rgba(59, 130, 246, 0.7))"
                            ]
                          }}
                          transition={{ 
                            type: "tween", 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut"
                          }}
                        />
                      )}
                    </button>
                    {showWarning === 'boxes' && getTabDisabledMessage('boxes') && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-xs whitespace-nowrap z-10"
                      >
                        {getTabDisabledMessage('boxes')}
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => handleTabClick('satchels')}
                      onMouseEnter={() => canAccessTab('satchels') && playSound('hover')}
                      disabled={!canAccessTab('satchels')}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 relative flex items-center ${
                        !canAccessTab('satchels')
                          ? 'text-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50'
                          : selectedType === 'satchels' 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                            : 'text-gray-400 hover:text-white bg-white/5'
                      }`}
                      title={getTabDisabledMessage('satchels')}
                    >
                      {getTabIcon('satchels')}
                      <span className="ml-2">Satchels</span>
                      {!canAccessTab('satchels') && (
                        <Lock className="ml-2 text-red-500" size={14} />
                      )}
                      {selectedType !== 'satchels' && recommendedTab === 'satchels' && canAccessTab('satchels') && (
                        <motion.div 
                          className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            filter: [
                              "drop-shadow(0 0 0px rgba(59, 130, 246, 0.7))",
                              "drop-shadow(0 0 15px rgba(59, 130, 246, 1))",
                              "drop-shadow(0 0 0px rgba(59, 130, 246, 0.7))"
                            ]
                          }}
                          transition={{ 
                            type: "tween", 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut"
                          }}
                        />
                      )}
                    </button>
                    {showWarning === 'satchels' && getTabDisabledMessage('satchels') && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-xs whitespace-nowrap z-10"
                      >
                        {getTabDisabledMessage('satchels')}
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => handleTabClick('mainfreight')}
                      onMouseEnter={() => canAccessTab('mainfreight') && playSound('hover')}
                      disabled={!canAccessTab('mainfreight')}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 relative flex items-center ${
                        !canAccessTab('mainfreight')
                          ? 'text-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50'
                          : selectedType === 'mainfreight' 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                            : 'text-gray-400 hover:text-white bg-white/5'
                      }`}
                      title={getTabDisabledMessage('mainfreight')}
                    >
                      {getTabIcon('mainfreight')}
                      <span className="ml-2">Mainfreight</span>
                      {!canAccessTab('mainfreight') && (
                        <Lock className="ml-2 text-red-500" size={14} />
                      )}
                      {selectedType !== 'mainfreight' && recommendedTab === 'mainfreight' && canAccessTab('mainfreight') && (
                        <motion.div 
                          className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            filter: [
                              "drop-shadow(0 0 0px rgba(59, 130, 246, 0.7))",
                              "drop-shadow(0 0 15px rgba(59, 130, 246, 1))",
                              "drop-shadow(0 0 0px rgba(59, 130, 246, 0.7))"
                            ]
                          }}
                          transition={{ 
                            type: "tween", 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut"
                          }}
                        />
                      )}
                    </button>
                    {showWarning === 'mainfreight' && getTabDisabledMessage('mainfreight') && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-xs whitespace-nowrap z-10"
                      >
                        {getTabDisabledMessage('mainfreight')}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Package Grid or Mainfreight Config */}
                <AnimatePresence mode="wait">
                  {selectedType !== 'mainfreight' ? (
                    <PackageGrid
                      key={selectedType}
                      options={selectedType === 'boxes' ? boxOptions : courierBagOptions}
                      shipment={shipment}
                      onAdd={addToShipment}
                      onRemove={removeFromShipment}
                      onUpdateQuantity={updateShipmentQuantity}
                      recommendedId={recommendedId}
                      isSatchel={selectedType === 'satchels'}
                    />
                  ) : (
                    <MainfreightConfig
                      key="mainfreight"
                      onAdd={handleMainfreightAdd}
                    />
                  )}
                </AnimatePresence>

                {/* GameIcon Tier Guide - showing tier colors */}
                <div className="mt-6">
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 shadow-lg shadow-purple-500/20">
                    <div className="flex items-center justify-center mb-3">
                      <Sparkles className="text-purple-400 mr-2" size={16} />
                      <h3 className="text-base font-semibold text-purple-300">Package Tier Colors</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-3">
                        <GameIcon iconType="box" actualQuantity={1} size={48} iconSize="medium" />
                        <span className="text-white text-xl font-bold">= 1</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <GameIcon iconType="box" actualQuantity={5} size={48} iconSize="medium" />
                        <span className="text-white text-xl font-bold">= 5</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <GameIcon iconType="box" actualQuantity={25} size={48} iconSize="medium" />
                        <span className="text-white text-xl font-bold">= 25</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <GameIcon iconType="box" actualQuantity={125} size={48} iconSize="medium" />
                        <span className="text-white text-xl font-bold">= 125</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipment Summary Sidebar */}
          <div className="lg:col-span-1">
            <ShipmentSummary 
              shipment={shipment}
              allPackageOptions={allPackageOptions}
              onUpdateQuantity={updateShipmentQuantity}
              onRemoveItem={removeItemFromShipment}
              isCollapsed={!showSummary}
              onToggleCollapse={() => setShowSummary(!showSummary)}
              selectedType={selectedType}
            />
            
            {/* AI Recommendation - moved to sidebar */}
            {items.length > 0 && (
              <div className="mt-6">
                <PackageRecommendation 
                  items={items} 
                  shipment={shipment}
                  onSelect={(id) => {
                    const item = allPackageOptions.find(opt => opt.id === id);
                    if (item) {
                      const courierType = getCourierType(item);
                      const canAdd = canAccessTab(courierType === 'mainfreight' ? 'mainfreight' : 'boxes');
                      
                      if (!canAdd) {
                        playSound('error');
                        return;
                      }

                      if (boxOptions.includes(item)) setSelectedType('boxes');
                      else if (courierBagOptions.includes(item)) setSelectedType('satchels');
                      else if (palletOptions.includes(item)) setSelectedType('mainfreight');
                      addToShipment(item.id);
                      setShowWarning(null); // Clear any existing warnings
                    }
                  }} 
                />
              </div>
            )}
            
            {/* Confirm Button */}
            <div className="mt-6">
              <button
                onClick={handleConfirmPackaging}
                onMouseEnter={() => playSound('hover')}
                disabled={totalPackages === 0}
                className={`w-full px-8 py-4 rounded-xl font-semibold text-white transform transition-all duration-150 flex items-center justify-center ${
                  totalPackages === 0 
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 opacity-50 cursor-not-allowed' 
                    : totalPackages >= 250
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-lg hover:shadow-cyan-500/50 animate-pulse'
                    : totalPackages >= 125
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:shadow-lg hover:shadow-pink-500/50 animate-pulse'
                    : totalPackages >= 50
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:shadow-orange-500/50'
                    : totalPackages >= 20
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/50'
                    : totalPackages >= 10
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/50'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg hover:shadow-blue-500/50'
                }`}
              >
                {totalPackages > 0 ? (
                  <>
                    <GameIcon iconType="box" actualQuantity={totalPackages} size={24} iconSize="small" />
                    <span className="ml-2">
                      {totalPackages >= 250 ? (
                        <span className="flex items-center">
                          <Sparkles className="mr-1 animate-spin" size={16} />
                          Confirm COSMIC Shipment ({totalPackages} Packages)
                        </span>
                      ) : totalPackages >= 125 ? (
                        <span className="flex items-center">
                          <Sparkles className="mr-1" size={16} />
                          Confirm MEGA Shipment ({totalPackages} Packages)
                        </span>
                      ) : totalPackages >= 50 ? (
                        <span className="flex items-center">
                          <Sparkles className="mr-1" size={16} />
                          Confirm SUPER Shipment ({totalPackages} Packages)
                        </span>
                      ) : totalPackages >= 20 ? (
                        <span>Confirm Large Shipment ({totalPackages} Packages)</span>
                      ) : totalPackages >= 10 ? (
                        <span>Confirm Bulk Order ({totalPackages} Packages)</span>
                      ) : (
                        <span>Confirm {totalPackages} {totalPackages === 1 ? 'Package' : 'Packages'}</span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Package className="mr-2" size={20} />
                    Add packages to continue
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

export default PackagingSelectionScreen;