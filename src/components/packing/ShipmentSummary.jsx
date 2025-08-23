// src/components/packing/ShipmentSummary.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Package, X, Hash, Sparkles,
  Box, ShoppingBag, Truck, Plus, Minus
} from 'lucide-react';
import GameIcon from '../GameIcon';
import PackageQuantityControls from './PackageQuantityControls';
import { playSound } from '../../utils/audio';
import { useTierSystem } from '../../hooks/useTierSystem';

const getTierGradient = (option) => {
  if (option.iconType === 'box') {
    switch(option.id) {
      case 'box-s': return 'from-gray-400 to-gray-500';
      case 'box-m': return 'from-blue-400 to-blue-500';
      case 'box-l': return 'from-purple-400 to-pink-500';
      default: return 'from-gray-400 to-gray-500';
    }
  } else if (option.iconType === 'satchel') {
    switch(option.id) {
      case 'nzc-a4': return 'from-gray-400 to-gray-500';
      case 'nzc-a3': return 'from-red-400 to-red-500';
      case 'nzc-a2': return 'from-red-500 to-orange-500';
      default: return 'from-gray-400 to-gray-500';
    }
  } else if (option.iconType === 'pallet') {
    return 'from-purple-400 to-purple-600';
  }
  return 'from-gray-400 to-gray-500';
};

const ShipmentSummary = ({ 
  shipment, 
  allPackageOptions, 
  onUpdateQuantity, 
  onRemoveItem,
  isCollapsed = false,
  onToggleCollapse,
  selectedType = 'boxes' // Add selectedType prop to determine which icons to show
}) => {
  // Calculate total packages
  const getTotalPackages = () => {
    return Object.values(shipment).reduce((sum, quantity) => sum + quantity, 0);
  };

  // Get package details by ID
  const getPackageById = (packageId) => {
    return allPackageOptions.find(pkg => pkg.id === packageId);
  };

  // Get sorted shipment items (for consistent rendering)
  const getShipmentItems = () => {
    return Object.entries(shipment)
      .filter(([_, quantity]) => quantity > 0)
      .map(([packageId, quantity]) => ({
        packageId,
        quantity,
        package: getPackageById(packageId)
      }))
      .filter(item => item.package) // Filter out any invalid package IDs
      .sort((a, b) => a.package.name.localeCompare(b.package.name));
  };

  const shipmentItems = getShipmentItems();
  const totalPackages = getTotalPackages();

  // Animation variants - using maxHeight instead of height to prevent jitter
  const containerVariants = {
    expanded: { 
      maxHeight: '2000px', // Large enough to accommodate any content
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] // Custom easing for smoother animation
      }
    },
    collapsed: { 
      maxHeight: '120px', // Matches the header height needs
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: 50,
      scale: 0.8
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      x: -50,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  };

  const getPackageTypeIcon = (packageType) => {
    if (packageType?.includes('box')) return <Box size={16} />;
    if (packageType?.includes('satchel') || packageType?.includes('nzc')) return <ShoppingBag size={16} />;
    if (packageType?.includes('pallet') || packageType?.includes('mainfreight')) return <Truck size={16} />;
    return <Package size={16} />;
  };

  const getPackageTypeColor = (packageType, packageId) => {
    if (packageType?.includes('satchel') || packageType?.includes('nzc')) return 'text-yellow-400';
    if (packageType?.includes('pallet') || packageType?.includes('mainfreight')) return 'text-purple-400';
    // Different colors for different box sizes
    if (packageId === 'box-s') return 'text-gray-400';
    if (packageId === 'box-m') return 'text-blue-400';
    if (packageId === 'box-l') return 'text-purple-400';
    return 'text-blue-400';
  };
  
  const getPackageBackgroundGradient = (packageId) => {
    // Return gradient classes for different package types
    if (packageId === 'box-s') return 'from-gray-500/20 to-gray-600/20';
    if (packageId === 'box-m') return 'from-blue-500/20 to-blue-600/20';
    if (packageId === 'box-l') return 'from-purple-500/20 to-pink-500/20';
    if (packageId?.includes('nzc')) return 'from-yellow-500/20 to-orange-500/20';
    if (packageId?.includes('pallet') || packageId?.includes('custom')) return 'from-purple-500/20 to-purple-600/20';
    return 'from-white/5 to-white/10';
  };

  return (
    <motion.div
      className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 border border-white/10 relative overflow-hidden"
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={containerVariants}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between rounded-2xl px-2 py-1 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={(e) => {
          // Only trigger if the click wasn't on the arrow button
          if (!e.target.closest('.collapse-arrow')) {
            console.log('Header clicked!'); // Debug log
            if (onToggleCollapse) {
              onToggleCollapse();
              playSound('click');
            }
          }
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <ShoppingCart className="text-blue-400" size={24} />
            {totalPackages > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50"
              >
                <span className="text-white text-xs font-bold">{totalPackages}</span>
              </motion.div>
            )}
          </div>
          <h3 className="text-xl font-bold text-white">
            Shipment Summary
          </h3>
        </div>

        {/* Total Count Badge */}
        <div className="flex items-center space-x-4">
          {totalPackages > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl"
            >
              <span className="text-blue-300 text-sm font-semibold">
                {totalPackages} {totalPackages === 1 ? 'Package' : 'Packages'} Total
              </span>
            </motion.div>
          )}
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Arrow button clicked!'); // Debug log
              if (onToggleCollapse) {
                onToggleCollapse();
                playSound('click');
              }
            }}
            className="collapse-arrow text-gray-400 hover:text-white transition-all duration-200 p-3 rounded-lg hover:bg-white/10 cursor-pointer border border-transparent hover:border-white/20 relative z-50"
            style={{ 
              transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease-in-out, color 0.2s, background-color 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="mt-6">
          {shipmentItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="flex justify-center space-x-4 mb-4">
                <div className="opacity-30">
                  <GameIcon 
                    iconType={selectedType === 'satchels' ? 'satchel' : selectedType === 'mainfreight' ? 'pallet' : 'box'} 
                    iconCount={1} 
                    iconSize="small" 
                    size={40} 
                  />
                </div>
                <div className="opacity-40">
                  <GameIcon 
                    iconType={selectedType === 'satchels' ? 'satchel' : selectedType === 'mainfreight' ? 'pallet' : 'box'} 
                    iconCount={1} 
                    iconSize="medium" 
                    size={50} 
                  />
                </div>
                <div className="opacity-30">
                  <GameIcon 
                    iconType={selectedType === 'satchels' ? 'satchel' : selectedType === 'mainfreight' ? 'pallet' : 'box'} 
                    iconCount={1} 
                    iconSize="large" 
                    size={40} 
                  />
                </div>
              </div>
              <p className="text-gray-400 text-lg">No packages selected</p>
              <p className="text-gray-500 text-sm mt-2">
                Add {selectedType === 'satchels' ? 'satchels' : selectedType === 'mainfreight' ? 'freight packages' : 'boxes'} from the selection grid below
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {shipmentItems.map(({ packageId, quantity, package: pkg }) => (
                  <motion.div
                    key={packageId}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 relative group hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      {/* Package Info */}
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Game Icon with Gradient Bars */}
                        <div className="flex-shrink-0 text-center">
                          <div className="mb-2">
                            <GameIcon 
                              iconType={pkg.iconType} 
                              iconCount={quantity} // Show actual quantity for proper tier display
                              iconSize={pkg.iconSize}
                              size={48}
                            />
                          </div>
                          
                          {/* Size/Type indicator bars */}
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3].map((tier) => (
                              <motion.div
                                key={tier}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: tier * 0.05 }}
                                className={`w-6 h-0.5 rounded-full transition-all duration-300 ${
                                  tier <= (pkg.iconCount || 1)
                                    ? `bg-gradient-to-r ${getTierGradient(pkg)} shadow-sm`
                                    : 'bg-gray-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Package Details */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`${getPackageTypeColor(pkg.iconType, packageId)}`}>
                              {getPackageTypeIcon(pkg.iconType)}
                            </span>
                            <h4 className="text-white font-semibold">
                              {pkg.name}
                            </h4>
                            {/* Size/Type Badge */}
                            {packageId === 'box-s' && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-gray-500/20 text-gray-300 rounded-full">S</span>
                            )}
                            {packageId === 'box-m' && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 rounded-full">M</span>
                            )}
                            {packageId === 'box-l' && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 rounded-full">L</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">
                            {pkg.dimensions}
                          </p>
                          {pkg.courier && (
                            <p className="text-xs text-gray-500 mt-1">
                              {pkg.courier}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-4">
                        {/* Package Quantity Controls */}
                        <PackageQuantityControls
                          quantity={quantity}
                          onAdd={() => onUpdateQuantity(packageId, quantity + 1)}
                          onRemove={() => {
                            if (quantity > 1) {
                              onUpdateQuantity(packageId, quantity - 1);
                            } else {
                              onRemoveItem(packageId);
                            }
                          }}
                          onUpdateQuantity={(newQuantity) => {
                            if (newQuantity === 0) {
                              onRemoveItem(packageId);
                            } else {
                              onUpdateQuantity(packageId, newQuantity);
                            }
                          }}
                          className="relative"
                        />

                        {/* Remove Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            onRemoveItem(packageId);
                            playSound('error');
                          }}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/30"
                          title="Remove all packages of this type"
                        >
                          <X size={18} />
                        </motion.button>
                      </div>
                    </div>

                    {/* Special Badges */}
                    {(() => {
                      const tierInfo = useTierSystem(quantity);
                      if (!tierInfo?.name) return null;
                      
                      const tierConfig = {
                        'COSMIC': {
                          gradient: 'from-purple-600 via-pink-600 to-cyan-600',
                          shadow: 'shadow-cyan-500/50',
                          animate: true
                        },
                        'MEGA': {
                          gradient: 'from-purple-600 via-pink-600 to-red-600',
                          shadow: 'shadow-pink-500/50',
                          animate: true
                        },
                        'SUPER': {
                          gradient: 'from-yellow-500 to-orange-500',
                          shadow: 'shadow-orange-500/50',
                          animate: false
                        },
                        'TIER': {
                          gradient: 'from-blue-500 to-blue-700',
                          shadow: 'shadow-blue-500/50',
                          animate: false
                        }
                      };
                      
                      const config = tierConfig[tierInfo.name];
                      if (!config) return null;
                      
                      return (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -left-2"
                        >
                          <div className={`px-3 py-1 bg-gradient-to-r ${config.gradient} rounded-full shadow-lg ${config.shadow} ${config.animate ? 'animate-pulse' : ''}`}>
                            <span className="text-white text-xs font-bold flex items-center">
                              <Sparkles size={12} className="mr-1" />
                              {tierInfo.name}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Summary Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 pt-6 border-t border-white/10"
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-gray-400 text-sm">Types</p>
                    <p className="text-2xl font-bold text-white">
                      {shipmentItems.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Items</p>
                    <p className={`text-2xl font-bold ${
                      (() => {
                        const tierInfo = useTierSystem(totalPackages);
                        if (tierInfo?.name === 'COSMIC') {
                          return 'text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text animate-pulse';
                        } else if (tierInfo?.name === 'MEGA') {
                          return 'text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text animate-pulse';
                        } else if (tierInfo?.name === 'SUPER') {
                          return 'text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text';
                        } else if (tierInfo?.name === 'TIER') {
                          return 'text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text';
                        } else {
                          return 'bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent';
                        }
                      })()
                    }`}>
                      {totalPackages}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Tiered Items</p>
                    <p className="text-2xl font-bold text-green-400">
                      {shipmentItems.filter(item => {
                        const tierInfo = useTierSystem(item.quantity);
                        return tierInfo?.name !== null;
                      }).length}
                    </p>
                  </div>
                </div>
                
                {/* Tier Breakdown if any */}
                {shipmentItems.some(item => {
                  const tierInfo = useTierSystem(item.quantity);
                  return tierInfo?.name !== null;
                }) && (
                  <div className="mt-4 flex justify-center space-x-4">
                    {(() => {
                      const tierCounts = {
                        'COSMIC': { count: 0, color: 'text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text' },
                        'MEGA': { count: 0, color: 'text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text' },
                        'SUPER': { count: 0, color: 'text-yellow-400' },
                        'TIER': { count: 0, color: 'text-blue-400' }
                      };
                      
                      shipmentItems.forEach(item => {
                        const tierInfo = useTierSystem(item.quantity);
                        if (tierInfo?.name && tierCounts[tierInfo.name]) {
                          tierCounts[tierInfo.name].count++;
                        }
                      });
                      
                      return Object.entries(tierCounts)
                        .filter(([_, data]) => data.count > 0)
                        .map(([tierName, data]) => (
                          <div key={tierName} className={`text-xs font-semibold ${data.color}`}>
                            {data.count} {tierName === 'TIER' ? 'Standard' : tierName}
                          </div>
                        ));
                    })()}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 blur-3xl rounded-full" />
    </motion.div>
  );
};

export default ShipmentSummary;