// src/components/packing/PackageRecommendation.jsx
// Updated to support iconSize from merged implementation

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import GameIcon from '../GameIcon';
import { boxOptions, courierBagOptions, palletOptions } from '../../data/packingData';
import { playSound } from '../../utils/audio';

const PackageRecommendation = ({ items, onSelect, shipment = {} }) => {
  // ... existing recommendation logic ...
  
  // Example: Calculate recommended package based on items
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
    else return 'pallet-custom';
  };
  
  const recommendedId = getRecommendedId();

  const recommendedPackage = [...boxOptions, ...courierBagOptions, ...palletOptions].find(
    opt => opt.id === recommendedId
  );

  // Check if the recommended package is already selected
  const isAlreadySelected = shipment[recommendedId] > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto mb-4"
    >
      <motion.div 
        className="relative bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-4 shadow-lg shadow-blue-500/20"
        animate={{
          boxShadow: [
            "0 10px 25px rgba(59, 130, 246, 0.2)",
            "0 10px 25px rgba(147, 51, 234, 0.3)",
            "0 10px 25px rgba(59, 130, 246, 0.2)",
          ]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="flex items-center justify-center mb-3">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1, 1.05, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="text-blue-400 mr-2" size={18} />
          </motion.div>
          <h3 className="text-base font-semibold text-blue-300">AI Recommendation</h3>
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, 0],
              scale: [1, 1.05, 1, 1.1, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 1.5,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="text-purple-400 ml-2" size={14} />
          </motion.div>
        </div>
        
        {recommendedPackage && (
          <div 
            onClick={() => {
              playSound('combo'); // Special magical sound for AI recommendation
              onSelect(recommendedId);
            }}
            onMouseEnter={() => playSound('hover')}
            className="cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="flex justify-center mb-2">
              <GameIcon 
                iconType={recommendedPackage.iconType} 
                iconCount={1}
                iconSize={recommendedPackage.iconSize} // Use the iconSize from data
                size={60}
              />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">{recommendedPackage.name}</p>
              <p className="text-gray-400 text-xs">{recommendedPackage.dimensions}</p>
              <motion.button 
                className={`relative mt-2 px-4 py-2 ${
                  isAlreadySelected 
                    ? 'bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 border-green-500/50 text-green-300' 
                    : 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 hover:from-blue-500/30 hover:via-purple-500/30 hover:to-blue-500/30 border border-blue-500/50 hover:border-purple-500/50 text-blue-300'
                } rounded-lg font-medium text-sm transition-all overflow-hidden group cursor-${isAlreadySelected ? 'default' : 'pointer'}`}
                onMouseEnter={() => !isAlreadySelected && playSound('hover')}
                whileHover={!isAlreadySelected ? { scale: 1.05 } : {}}
                whileTap={!isAlreadySelected ? { scale: 0.98 } : {}}
                disabled={isAlreadySelected}
              >
                {/* Sparkle animations - only show when not selected */}
                {!isAlreadySelected && (
                  <>
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute"
                          style={{
                            left: `${15 + (i * 12)}%`,
                            top: `${20 + (i % 3) * 20}%`,
                          }}
                          animate={{
                            scale: [0, 1, 0],
                            rotate: [0, 180, 360],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: "easeInOut"
                          }}
                        >
                          <Sparkles size={8} className="text-yellow-300" />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "easeInOut"
                      }}
                    />
                  </>
                )}

                <span className="relative z-10 flex items-center">
                  {isAlreadySelected ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <svg className="mr-2 text-green-400" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                      Selected
                    </>
                  ) : (
                    <>
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Sparkles size={14} className="mr-2" />
                      </motion.div>
                      Select This Package
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PackageRecommendation;