import React from 'react';
import { motion } from 'framer-motion';
import { useMagnetEffect } from '../hooks/useMagnetEffect';
import { ChevronRight } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'primary',
  clickable = false,
  onClick
}) => {
  const magnetRef = useMagnetEffect(0.2);

  const colorClasses = {
    primary: 'from-primary to-accent',
    success: 'from-green-500 to-green-600',
    warning: 'from-yellow-500 to-yellow-600',
    danger: 'from-red-500 to-red-600'
  };

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      ref={magnetRef}
      whileHover={{ scale: 1.02 }}
      whileTap={clickable ? { scale: 0.98 } : {}}
      className={`glass-card p-6 rounded-xl hover-lift ${
        clickable ? 'cursor-pointer hover:border-primary/50 transition-all' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold mb-2">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
            <Icon size={24} />
          </div>
          {clickable && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-gray-500"
            >
              <ChevronRight size={16} />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;