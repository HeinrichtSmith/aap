import React from 'react';
import { Zap, TrendingUp, Activity } from 'lucide-react';

const PriorityBadge = ({ priority, size = 'sm' }) => {
  const getPriorityStyle = () => {
    switch (priority) {
      case 'urgent':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-500/50 shadow-lg shadow-red-500/50';
      case 'overnight':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-500/50 shadow-lg shadow-purple-500/50';
      default:
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-500/50 shadow-lg shadow-blue-500/50';
    }
  };

  const getPriorityIcon = () => {
    const iconSize = size === 'lg' ? 20 : 14;
    switch (priority) {
      case 'urgent':
        return <Zap size={iconSize} />;
      case 'overnight':
        return <TrendingUp size={iconSize} />;
      default:
        return <Activity size={iconSize} />;
    }
  };

  const sizeClasses = size === 'lg' 
    ? 'px-6 py-3 text-lg' 
    : 'px-3 py-1 text-xs';
  
  const gapClass = size === 'lg' ? 'gap-1' : 'gap-1';

  return (
    <span className={`${sizeClasses} rounded-full font-bold uppercase border flex items-center ${gapClass} ${getPriorityStyle()}`}>
      {getPriorityIcon()}
      {priority}
    </span>
  );
};

export default PriorityBadge;