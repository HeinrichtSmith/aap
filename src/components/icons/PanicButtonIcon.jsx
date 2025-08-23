import React from 'react';
import { motion } from 'framer-motion';

const PanicButtonIcon = ({ adjustedSize, isTierBox = false, tierType = 'normal' }) => {
  const size = adjustedSize || 80;
  const baseSize = size * 0.8;
  
  // Tier colors
  const getTierColors = () => {
    switch(tierType) {
      case 'cosmic':
        return {
          body: 'from-purple-400 via-pink-500 to-cyan-400',
          button: 'from-red-400 via-red-500 to-red-600',
          accent: 'from-pink-400 to-purple-400',
          glow: 'drop-shadow-lg drop-shadow-purple-500/50'
        };
      case 'mega':
        return {
          body: 'from-purple-400 via-pink-500 to-red-500',
          button: 'from-red-400 via-red-500 to-red-600',
          accent: 'from-pink-400 to-red-400',
          glow: 'drop-shadow-lg drop-shadow-pink-500/50'
        };
      case 'super':
        return {
          body: 'from-yellow-400 to-orange-600',
          button: 'from-red-400 via-red-500 to-red-600',
          accent: 'from-orange-500 to-red-600',
          glow: 'drop-shadow-lg drop-shadow-orange-500/50'
        };
      case 'standard':
        return {
          body: 'from-blue-400 to-blue-600',
          button: 'from-red-400 via-red-500 to-red-600',
          accent: 'from-blue-500 to-blue-700',
          glow: 'drop-shadow-lg drop-shadow-blue-500/50'
        };
      default:
        return {
          body: 'from-gray-400 to-gray-600',
          button: 'from-red-400 via-red-500 to-red-600',
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
      {/* Panic button body */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors.body} border-2 border-white/20`}
        style={{
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* Red panic button */}
      <motion.div
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${colors.button} border-2 border-white/30`}
        style={{
          width: baseSize * 0.6,
          height: baseSize * 0.6,
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)'
        }}
        animate={isTierBox && (tierType === 'cosmic' || tierType === 'mega') ? {
          scale: [1, 1.1, 1],
          boxShadow: [
            'inset 0 2px 4px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)',
            'inset 0 2px 4px rgba(255,255,255,0.3), 0 4px 12px rgba(255,0,0,0.6)',
            'inset 0 2px 4px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)'
          ]
        } : {}}
        transition={{
          duration: 1.5,
          repeat: isTierBox && (tierType === 'cosmic' || tierType === 'mega') ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      
      {/* Button text/symbol */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-lg">
        !
      </div>
      
      {/* Warning symbol */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-1 h-3 bg-red-600 rounded-full"></div>
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full"></div>
      
      {/* Wireless indicator */}
      <div className="absolute top-2 right-2 flex flex-col items-center">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 mb-px bg-white/60 rounded"
            style={{
              height: (i + 1) * 2
            }}
            animate={{
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
      
      {/* Battery indicator */}
      <div
        className={`absolute bottom-2 left-2 w-4 h-2 bg-gradient-to-r ${colors.accent} border border-white/20 rounded-sm`}
        style={{
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}
      />
      <div className="absolute bottom-2 right-1 w-1 h-1 bg-white/60 rounded-sm"></div>
      
      {/* Emergency glow effect */}
      {isTierBox && (tierType === 'cosmic' || tierType === 'mega') && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(255, 0, 0, 0.4) 0%, transparent 70%)`
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Tier glow effect */}
      {isTierBox && (tierType === 'cosmic' || tierType === 'mega') && (
        <motion.div
          className="absolute inset-0 rounded-full"
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

export default PanicButtonIcon; 