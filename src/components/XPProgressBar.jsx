import React from 'react';
import { motion } from 'framer-motion';

const XPProgressBar = ({ current, max, level }) => {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Level {level}</span>
        <span className="text-xs text-gray-400">
          {current} / {max} XP
        </span>
      </div>
      <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden border border-gray-700/50">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full relative overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "loop",
              ease: "linear"
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default XPProgressBar;