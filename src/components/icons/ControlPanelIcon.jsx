import React from 'react';
import { motion } from 'framer-motion';

const ControlPanelIcon = ({ adjustedSize, isTierBox = false, tierType = 'normal' }) => {
  const size = adjustedSize || 80;
  const baseSize = size * 0.8;
  
  // Tier colors
  const getTierColors = () => {
    switch(tierType) {
      case 'cosmic':
        return {
          body: 'from-purple-400 via-pink-500 to-cyan-400',
          screen: 'from-cyan-300 to-purple-300',
          accent: 'from-pink-400 to-purple-400',
          glow: 'drop-shadow-lg drop-shadow-purple-500/50'
        };
      case 'mega':
        return {
          body: 'from-purple-400 via-pink-500 to-red-500',
          screen: 'from-red-300 to-purple-300',
          accent: 'from-pink-400 to-red-400',
          glow: 'drop-shadow-lg drop-shadow-pink-500/50'
        };
      case 'super':
        return {
          body: 'from-yellow-400 to-orange-600',
          screen: 'from-yellow-300 to-orange-400',
          accent: 'from-orange-500 to-red-600',
          glow: 'drop-shadow-lg drop-shadow-orange-500/50'
        };
      case 'standard':
        return {
          body: 'from-blue-400 to-blue-600',
          screen: 'from-blue-300 to-cyan-300',
          accent: 'from-blue-500 to-blue-700',
          glow: 'drop-shadow-lg drop-shadow-blue-500/50'
        };
      default:
        return {
          body: 'from-gray-400 to-gray-600',
          screen: 'from-gray-300 to-gray-500',
          accent: 'from-gray-500 to-gray-700',
          glow: 'drop-shadow-lg drop-shadow-gray-500/30'
        };
    }
  };

  const colors = getTierColors();
  
  return (
    <motion.div
      className={`relative ${colors.glow}`}
      style={{ width: baseSize, height: baseSize }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Control panel body */}
      <div
        className={`absolute inset-0 rounded-lg bg-gradient-to-br ${colors.body} border-2 border-white/20`}
        style={{
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* Screen/Display */}
      <div
        className={`absolute top-3 left-3 right-3 bg-gradient-to-br ${colors.screen} border border-white/30 rounded`}
        style={{
          height: baseSize * 0.4,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 2px 4px rgba(255,255,255,0.2)'
        }}
      />
      
      {/* Screen content */}
      <div
        className="absolute top-4 left-4 right-4 bg-black/60 rounded-sm"
        style={{
          height: baseSize * 0.32
        }}
      >
        {/* Status indicators */}
        <div className="absolute top-2 left-2 flex space-x-1">
          <div className="w-1 h-1 bg-green-400 rounded-full"></div>
          <div className="w-1 h-1 bg-red-400 rounded-full"></div>
          <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
        </div>
        
        {/* Display lines */}
        <div className="absolute bottom-2 left-2 right-2 space-y-1">
          <div className="h-px bg-white/40 w-3/4"></div>
          <div className="h-px bg-white/30 w-1/2"></div>
        </div>
      </div>
      
      {/* Control buttons */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded bg-gradient-to-br ${colors.accent} border border-white/20`}
            style={{
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
          />
        ))}
      </div>
      
      {/* WiFi indicator */}
      <div
        className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-br ${colors.accent} border border-white/20`}
        style={{
          boxShadow: `0 0 4px ${tierType === 'cosmic' ? 'rgba(34, 211, 238, 0.8)' : 'rgba(59, 130, 246, 0.6)'}`
        }}
      />
      
      {/* Tier glow effect */}
      {isTierBox && (tierType === 'cosmic' || tierType === 'mega') && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{
            background: `radial-gradient(circle, ${tierType === 'cosmic' ? 'rgba(34, 211, 238, 0.3)' : 'rgba(236, 72, 153, 0.3)'} 0%, transparent 70%)`
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
};

export default ControlPanelIcon; 