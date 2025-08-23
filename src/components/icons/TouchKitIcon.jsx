import React from 'react';
import { motion } from 'framer-motion';

const TouchKitIcon = ({ adjustedSize, isTierBox = false, tierType = 'normal' }) => {
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
      {/* Device body */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colors.body} border-2 border-white/20`}
        style={{
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* Screen */}
      <div
        className={`absolute top-3 left-3 right-3 bg-gradient-to-br ${colors.screen} border border-white/30 rounded-xl`}
        style={{
          height: baseSize * 0.45,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
      
      {/* Screen content */}
      <div
        className="absolute top-4 left-4 right-4 bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-lg"
        style={{
          height: baseSize * 0.35,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
        }}
      />
      
      {/* Screen reflection */}
      <div
        className="absolute top-4 left-4 bg-gradient-to-br from-white/30 to-transparent rounded-lg"
        style={{
          width: baseSize * 0.3,
          height: baseSize * 0.15
        }}
      />
      
      {/* Touch interface elements */}
      <div className="absolute top-6 left-6 right-6 flex justify-between">
        {[1, 2, 3].map((dot) => (
          <motion.div
            key={dot}
            className="w-1 h-1 bg-blue-400 rounded-full"
            style={{
              boxShadow: '0 0 2px rgba(59, 130, 246, 0.8)'
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: dot * 0.3
            }}
          />
        ))}
      </div>
      
      {/* Control buttons */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        {[1, 2, 3].map((button) => (
          <div
            key={button}
            className={`w-3 h-2 rounded-sm bg-gradient-to-br ${colors.accent} border border-white/20`}
            style={{
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.3)'
            }}
          />
        ))}
      </div>
      
      {/* Status LED */}
      <motion.div
        className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gradient-to-br ${colors.accent} border border-white/20`}
        style={{
          boxShadow: `0 0 4px ${tierType === 'cosmic' ? 'rgba(34, 211, 238, 0.8)' : 'rgba(59, 130, 246, 0.6)'}`
        }}
        animate={{
          opacity: [0.7, 1, 0.7],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Brand label */}
      <div className="absolute bottom-1 left-2 right-2 text-center">
        <div className="text-xs font-mono text-white/60" style={{ fontSize: '5px' }}>
          TOUCH KIT
        </div>
      </div>
      
      {/* Wireless indicator */}
      <div className="absolute top-2 left-2 flex space-x-0.5">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className="w-0.5 bg-white/40 rounded-full"
            style={{
              height: `${bar * 2}px`
            }}
          />
        ))}
      </div>
      
      {/* Tier glow effect */}
      {isTierBox && (tierType === 'cosmic' || tierType === 'mega') && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
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

export default TouchKitIcon; 