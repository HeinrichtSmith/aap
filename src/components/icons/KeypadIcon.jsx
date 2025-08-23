import React from 'react';
import { motion } from 'framer-motion';

const KeypadIcon = ({ adjustedSize, isTierBox = false, tierType = 'normal' }) => {
  const size = adjustedSize || 80;
  const baseSize = size * 0.8;
  
  // Tier colors
  const getTierColors = () => {
    switch(tierType) {
      case 'cosmic':
        return {
          body: 'from-purple-400 via-pink-500 to-cyan-400',
          display: 'from-cyan-300 to-purple-300',
          accent: 'from-pink-400 to-purple-400',
          glow: 'drop-shadow-lg drop-shadow-purple-500/50'
        };
      case 'mega':
        return {
          body: 'from-purple-400 via-pink-500 to-red-500',
          display: 'from-red-300 to-purple-300',
          accent: 'from-pink-400 to-red-400',
          glow: 'drop-shadow-lg drop-shadow-pink-500/50'
        };
      case 'super':
        return {
          body: 'from-yellow-400 to-orange-600',
          display: 'from-yellow-300 to-orange-400',
          accent: 'from-orange-500 to-red-600',
          glow: 'drop-shadow-lg drop-shadow-orange-500/50'
        };
      case 'standard':
        return {
          body: 'from-blue-400 to-blue-600',
          display: 'from-blue-300 to-cyan-300',
          accent: 'from-blue-500 to-blue-700',
          glow: 'drop-shadow-lg drop-shadow-blue-500/50'
        };
      default:
        return {
          body: 'from-gray-400 to-gray-600',
          display: 'from-gray-300 to-gray-500',
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
      {/* Keypad body */}
      <div
        className={`absolute inset-0 rounded-lg bg-gradient-to-br ${colors.body} border-2 border-white/20`}
        style={{
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* LCD Display */}
      <div
        className={`absolute top-2 left-2 right-2 bg-gradient-to-br ${colors.display} border border-white/30 rounded`}
        style={{
          height: baseSize * 0.25,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* LCD screen */}
      <div
        className="absolute top-3 left-3 right-3 bg-black/80 rounded-sm flex items-center justify-center"
        style={{
          height: baseSize * 0.17
        }}
      >
        <div className="text-green-400 font-mono text-xs opacity-80">****</div>
      </div>
      
      {/* Number pad grid */}
      <div 
        className="absolute left-2 right-2 grid grid-cols-3 gap-0.5"
        style={{
          top: baseSize * 0.35,
          bottom: baseSize * 0.08
        }}
      >
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`bg-gradient-to-br ${colors.accent} border border-white/20 rounded-sm flex items-center justify-center min-h-0`}
            style={{
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              fontSize: `${Math.max(baseSize * 0.08, 8)}px`,
              minHeight: `${baseSize * 0.12}px`
            }}
          >
            <span className="text-white font-bold opacity-60 leading-none">
              {i < 9 ? i + 1 : i === 9 ? '*' : i === 10 ? '0' : '#'}
            </span>
          </div>
        ))}
      </div>
      
      {/* Proximity reader indicator */}
      <div
        className={`absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-br ${colors.accent} border border-white/20`}
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

export default KeypadIcon; 