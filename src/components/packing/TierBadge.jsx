import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useTierSystem } from '../../hooks/useTierSystem';

const TierBadge = ({ quantity }) => {
  const tierInfo = useTierSystem(quantity);

  if (!tierInfo?.name) return null;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -15 }}
      animate={{ scale: 1, rotate: 0 }}
      className="absolute top-12 left-3 pointer-events-none z-20"
    >
      <div className={`px-3 py-1 bg-gradient-to-r ${tierInfo.badgeGradient} rounded-full shadow-lg ${tierInfo.badgeShadow}`}>
        <span className="text-white text-xs font-bold flex items-center">
          <Sparkles size={12} className={`mr-1 ${tierInfo.animate ? 'animate-spin' : ''}`} />
          {tierInfo.name}
        </span>
      </div>
    </motion.div>
  );
};

export default TierBadge; 