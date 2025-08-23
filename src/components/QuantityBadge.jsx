import React from 'react';
import { motion } from 'framer-motion';

const QuantityBadge = ({ quantity, tierStyle, megaTier, cosmicTier }) => {
  if (quantity <= 1) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-white font-bold text-xs shadow-lg bg-gradient-to-r ${tierStyle.badgeColor}`}
      style={{
        boxShadow: `0 4px 14px 0 ${tierStyle.glowColor}`,
        border: cosmicTier ? '2px solid rgba(255,255,255,0.5)' : 'none'
      }}
    >
      <span className="relative z-10">x{quantity}</span>
      {(megaTier || cosmicTier) && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: cosmicTier 
              ? `radial-gradient(circle, ${tierStyle.glowColor} 0%, rgba(236, 72, 153, 0.4) 50%, transparent 70%)` 
              : `radial-gradient(circle, ${tierStyle.glowColor} 0%, transparent 70%)`,
            filter: cosmicTier ? 'blur(10px)' : 'blur(8px)'
          }}
          animate={{
            opacity: cosmicTier ? [0.6, 1, 0.6] : [0.5, 1, 0.5],
            scale: cosmicTier ? [1, 1.4, 1] : [1, 1.2, 1]
          }}
          transition={{
            duration: cosmicTier ? 1.5 : 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
};

export default QuantityBadge; 