import React from 'react';
import { motion } from 'framer-motion';

const SwitchIcon = ({ adjustedSize, isTierBox = false, tierType = 'normal' }) => {
  const size = adjustedSize || 80;
  const baseSize = size * 0.8;
  
  // Tier colors
  const getTierColors = () => {
    switch(tierType) {
      case 'cosmic':
        return {
          body: 'from-purple-400 via-pink-500 to-cyan-400',
          ports: 'from-cyan-300 to-purple-300',
          accent: 'from-pink-400 to-purple-400',
          glow: 'drop-shadow-lg drop-shadow-purple-500/50'
        };
      case 'mega':
        return {
          body: 'from-purple-400 via-pink-500 to-red-500',
          ports: 'from-red-300 to-purple-300',
          accent: 'from-pink-400 to-red-400',
          glow: 'drop-shadow-lg drop-shadow-pink-500/50'
        };
      case 'super':
        return {
          body: 'from-yellow-400 to-orange-600',
          ports: 'from-yellow-300 to-orange-400',
          accent: 'from-orange-500 to-red-600',
          glow: 'drop-shadow-lg drop-shadow-orange-500/50'
        };
      case 'standard':
        return {
          body: 'from-blue-400 to-blue-600',
          ports: 'from-blue-300 to-cyan-300',
          accent: 'from-blue-500 to-blue-700',
          glow: 'drop-shadow-lg drop-shadow-blue-500/50'
        };
      default:
        return {
          body: 'from-gray-400 to-gray-600',
          ports: 'from-gray-300 to-gray-500',
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
      {/* Switch body */}
      <div
        className={`absolute inset-0 rounded-lg bg-gradient-to-br ${colors.body} border-2 border-white/20`}
        style={{
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* Front panel */}
      <div
        className={`absolute top-2 left-2 right-2 bottom-2 rounded-md bg-gradient-to-br ${colors.ports} border border-white/30`}
        style={{
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
      
      {/* Ethernet ports row 1 */}
      <div className="absolute top-4 left-4 right-4 flex justify-between">
        {[1, 2, 3, 4].map((port) => (
          <div
            key={port}
            className="w-2 h-1.5 bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 rounded-sm"
            style={{
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
            }}
          />
        ))}
      </div>
      
      {/* Ethernet ports row 2 */}
      <div className="absolute top-7 left-4 right-4 flex justify-between">
        {[5, 6, 7, 8].map((port) => (
          <div
            key={port}
            className="w-2 h-1.5 bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 rounded-sm"
            style={{
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
            }}
          />
        ))}
      </div>
      
      {/* Status LEDs */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        {[1, 2, 3, 4].map((led) => (
          <motion.div
            key={led}
            className={`w-1 h-1 rounded-full ${
              led <= 2 ? 'bg-green-400' : led === 3 ? 'bg-yellow-400' : 'bg-gray-600'
            }`}
            style={{
              boxShadow: led <= 2 ? '0 0 2px rgba(34, 197, 94, 0.8)' : 
                       led === 3 ? '0 0 2px rgba(251, 191, 36, 0.8)' : 'none'
            }}
            animate={led <= 2 ? {
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1]
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: led * 0.2
            }}
          />
        ))}
      </div>
      
      {/* Power LED */}
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
      <div className="absolute bottom-2 left-2 right-2 text-center">
        <div className="text-xs font-mono text-white/60" style={{ fontSize: '6px' }}>
          SWITCH
        </div>
      </div>
      
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

export default SwitchIcon; 