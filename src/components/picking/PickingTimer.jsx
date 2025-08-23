import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatTime } from '../../utils/formatters';
import { playSound } from '../../utils/audio';

const PickingTimer = ({ onComplete, isActive, compact = false, color = 'blue' }) => {
  const [seconds, setSeconds] = useState(0);
  const [showPulse, setShowPulse] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1;
          if (newSeconds % 60 === 0 && newSeconds > 0) {
            playSound('tick');
            setShowPulse(true);
            setTimeout(() => setShowPulse(false), 2000);
          }
          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive && seconds > 0) {
      onComplete(seconds);
    }
  }, [isActive, seconds, onComplete]);

  // Create a subtle breathing animation for the timer
  const breathingAnimation = {
    scale: [1, 1.02, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Get color-specific gradients and styles
  const getColorStyles = (colorName) => {
    switch (colorName) {
      case 'purple':
        return {
          textGradient: 'from-purple-300 via-indigo-300 to-purple-300',
          blurGradient: 'from-purple-400 via-indigo-400 to-purple-400',
          borderColor: 'border-purple-400',
          flashGradient: 'rgba(147, 51, 234, 0.4)', // purple-500 with opacity
        };
      case 'blue':
      default:
        return {
          textGradient: 'from-blue-400 via-cyan-400 to-blue-400',
          blurGradient: 'from-blue-400 via-cyan-400 to-blue-400',
          borderColor: 'border-cyan-400',
          flashGradient: 'rgba(56, 189, 248, 0.4)', // cyan-400 with opacity
        };
    }
  };

  const colorStyles = getColorStyles(color);

  if (compact) {
    return (
      <div className="relative inline-flex items-center px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
        <motion.span 
          className={`text-base font-medium transition-all duration-300 ${
            showPulse ? 'text-blue-400' : 'text-white'
          }`}
          animate={showPulse ? {
            scale: [1, 1.05, 1],
          } : {}}
          transition={{ duration: 0.5 }}
        >
          {formatTime(seconds)}
        </motion.span>
        
        {/* Subtle pulse effect */}
        {showPulse && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.3, 0],
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-sm" />
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Modern timer container */}
      <motion.div
        animate={isActive ? { scale: [1, 1.01, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex items-center justify-center w-28 h-28 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden"
      >
        {/* Active gradient background */}
        {isActive && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10" />
          </motion.div>
        )}
        
        {/* Timer text */}
        <div className="relative z-10">
          <motion.div
            key={seconds}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`text-2xl font-semibold transition-all duration-300 ${
              showPulse ? 'text-blue-400' : 'text-white'
            }`}
          >
            {formatTime(seconds)}
          </motion.div>
        </div>
        
        {/* Minute pulse effect */}
        {showPulse && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.4, 0],
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-blue-500/30 rounded-2xl" />
          </motion.div>
        )}
        
        {/* Active border glow */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-2xl border border-blue-500/20"
            animate={{
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>
      
      {/* Status indicator */}
      <div className="mt-3 flex items-center space-x-2">
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
          isActive 
            ? 'bg-green-400' 
            : 'bg-gray-500'
        }`} />
        <span className="text-xs font-medium text-gray-400">
          {isActive ? 'Active' : 'Paused'}
        </span>
      </div>
    </div>
  );
};

export default PickingTimer;