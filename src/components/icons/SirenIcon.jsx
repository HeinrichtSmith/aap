import React from 'react';
import { motion } from 'framer-motion';

const SirenIcon = ({ adjustedSize, isTierBox = false, tierType = 'normal' }) => {
  const size = adjustedSize || 80;
  const baseSize = size * 0.8;
  
  // Tier colors
  const getTierColors = () => {
    switch(tierType) {
      case 'cosmic':
        return {
          body: 'from-purple-400 via-pink-500 to-cyan-400',
          speaker: 'from-cyan-300 to-purple-300',
          accent: 'from-pink-400 to-purple-400',
          glow: 'drop-shadow-lg drop-shadow-purple-500/50'
        };
      case 'mega':
        return {
          body: 'from-purple-400 via-pink-500 to-red-500',
          speaker: 'from-red-300 to-purple-300',
          accent: 'from-pink-400 to-red-400',
          glow: 'drop-shadow-lg drop-shadow-pink-500/50'
        };
      case 'super':
        return {
          body: 'from-yellow-400 to-orange-600',
          speaker: 'from-yellow-300 to-orange-400',
          accent: 'from-orange-500 to-red-600',
          glow: 'drop-shadow-lg drop-shadow-orange-500/50'
        };
      case 'standard':
        return {
          body: 'from-blue-400 to-blue-600',
          speaker: 'from-blue-300 to-cyan-300',
          accent: 'from-blue-500 to-blue-700',
          glow: 'drop-shadow-lg drop-shadow-blue-500/50'
        };
      default:
        return {
          body: 'from-gray-400 to-gray-600',
          speaker: 'from-gray-300 to-gray-500',
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
      {/* Siren body */}
      <div
        className={`absolute inset-0 rounded-lg bg-gradient-to-br ${colors.body} border-2 border-white/20`}
        style={{
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* Speaker grille */}
      <div
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${colors.speaker} border border-white/30`}
        style={{
          width: baseSize * 0.6,
          height: baseSize * 0.6,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* Speaker holes pattern */}
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{
          width: baseSize * 0.5,
          height: baseSize * 0.5
        }}
      >
        {/* Concentric circles */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-black/40"
            style={{
              width: `${(i + 1) * 33}%`,
              height: `${(i + 1) * 33}%`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
        
        {/* Radial lines */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-black/30"
            style={{
              width: '1px',
              height: baseSize * 0.2,
              top: '50%',
              left: '50%',
              transformOrigin: 'center bottom',
              transform: `translate(-50%, -100%) rotate(${i * 45}deg)`
            }}
          />
        ))}
      </div>
      
      {/* Strobe light */}
      <div
        className={`absolute top-2 right-2 w-3 h-3 rounded bg-gradient-to-br ${colors.accent} border border-white/20`}
        style={{
          boxShadow: `0 0 6px ${tierType === 'cosmic' ? 'rgba(34, 211, 238, 0.8)' : 'rgba(255, 255, 255, 0.6)'}`
        }}
      />
      
      {/* Mounting bracket */}
      <div
        className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-gradient-to-br ${colors.accent} border border-white/20 rounded-b-sm`}
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

export default SirenIcon; 