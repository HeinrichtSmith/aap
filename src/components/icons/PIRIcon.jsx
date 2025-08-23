import React from 'react';
import { motion } from 'framer-motion';

const PIRIcon = ({ adjustedSize, isTierBox = false, tierType = 'normal' }) => {
  const size = adjustedSize || 80;
  const baseSize = size * 0.8;
  
  // Tier colors
  const getTierColors = () => {
    switch(tierType) {
      case 'cosmic':
        return {
          body: 'from-purple-400 via-pink-500 to-cyan-400',
          sensor: 'from-cyan-300 to-purple-300',
          accent: 'from-pink-400 to-purple-400',
          glow: 'drop-shadow-lg drop-shadow-purple-500/50'
        };
      case 'mega':
        return {
          body: 'from-purple-400 via-pink-500 to-red-500',
          sensor: 'from-red-300 to-purple-300',
          accent: 'from-pink-400 to-red-400',
          glow: 'drop-shadow-lg drop-shadow-pink-500/50'
        };
      case 'super':
        return {
          body: 'from-yellow-400 to-orange-600',
          sensor: 'from-yellow-300 to-orange-400',
          accent: 'from-orange-500 to-red-600',
          glow: 'drop-shadow-lg drop-shadow-orange-500/50'
        };
      case 'standard':
        return {
          body: 'from-blue-400 to-blue-600',
          sensor: 'from-blue-300 to-cyan-300',
          accent: 'from-blue-500 to-blue-700',
          glow: 'drop-shadow-lg drop-shadow-blue-500/50'
        };
      default:
        return {
          body: 'from-gray-400 to-gray-600',
          sensor: 'from-gray-300 to-gray-500',
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
      {/* PIR body - rectangular */}
      <div
        className={`absolute top-2 left-2 right-2 bottom-6 rounded-lg bg-gradient-to-br ${colors.body} border-2 border-white/20`}
        style={{
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* PIR sensor lens */}
      <div
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${colors.sensor} border border-white/30`}
        style={{
          width: baseSize * 0.4,
          height: baseSize * 0.4,
          marginTop: -baseSize * 0.1,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 2px 4px rgba(255,255,255,0.2)'
        }}
      />
      
      {/* PIR grid pattern */}
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{
          width: baseSize * 0.3,
          height: baseSize * 0.3,
          marginTop: -baseSize * 0.1
        }}
      >
        {/* Horizontal lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full h-px bg-black/30" />
          ))}
        </div>
        {/* Vertical lines */}
        <div className="absolute inset-0 flex justify-between">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-px h-full bg-black/30" />
          ))}
        </div>
      </div>
      
      {/* Status LED */}
      <div
        className={`absolute top-3 right-3 w-2 h-2 rounded-full bg-gradient-to-br ${colors.accent} border border-white/20`}
        style={{
          boxShadow: `0 0 4px ${tierType === 'cosmic' ? 'rgba(34, 211, 238, 0.8)' : 'rgba(59, 130, 246, 0.6)'}`
        }}
      />
      
      {/* Mounting base */}
      <div
        className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-gradient-to-br ${colors.accent} border border-white/20 rounded-b-lg`}
        style={{
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
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

export default PIRIcon; 