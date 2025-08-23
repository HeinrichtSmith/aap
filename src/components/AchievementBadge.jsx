import React from 'react';
import { motion } from 'framer-motion';

const AchievementBadge = ({ achievement, size = 'normal', unlocked = true }) => {
  const sizeClasses = {
    small: 'w-12 h-12 text-2xl',
    normal: 'w-16 h-16 text-3xl',
    large: 'w-20 h-20 text-4xl'
  };

  const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    uncommon: 'from-green-400 to-green-500',
    rare: 'from-blue-400 to-blue-500',
    legendary: 'from-purple-400 to-purple-500'
  };

  return (
    <motion.div
      whileHover={unlocked ? { scale: 1.1, rotate: 5 } : {}}
      className={`${sizeClasses[size]} relative`}
    >
      <div
        className={`w-full h-full rounded-full flex items-center justify-center ${
          unlocked
            ? `bg-gradient-to-br ${rarityColors[achievement.rarity]} shadow-lg`
            : 'bg-gray-700'
        }`}
      >
        <span className={unlocked ? '' : 'opacity-30'}>
          {achievement.icon}
        </span>
      </div>
      
      {unlocked && achievement.rarity === 'legendary' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.2), transparent)',
          }}
        />
      )}
    </motion.div>
  );
};

export default AchievementBadge;