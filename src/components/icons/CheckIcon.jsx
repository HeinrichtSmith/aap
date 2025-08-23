import React from 'react';
import { getTierStyle } from '../../config/gameIconConstants';

const CheckIcon = ({ adjustedSize, isTierBox, tierType, tier, size, quantity }) => {
  const tierStyle = getTierStyle(tier || 'normal');
  
  return (
    <div 
      className={`relative flex items-center justify-center transition-all duration-300`}
      style={{ 
        width: adjustedSize, 
        height: adjustedSize,
        filter: tierStyle.animate ? `drop-shadow(0 0 20px ${tierStyle.glowColor})` : 'none'
      }}
    >
      <svg 
        width={adjustedSize * 0.8} 
        height={adjustedSize * 0.8} 
        viewBox="0 0 24 24" 
        fill="none"
        className={`${tierStyle.animate ? 'animate-pulse' : ''}`}
      >
        <defs>
          <linearGradient id={`checkGradient-${tier}-${quantity}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        
        {/* Checkmark Circle Background */}
        <circle
          cx="12"
          cy="12"
          r="10"
          fill={`url(#checkGradient-${tier}-${quantity})`}
          stroke={tierStyle.animate ? '#22c55e' : '#16a34a'}
          strokeWidth="2"
          className={tierStyle.animate ? 'animate-pulse' : ''}
        />
        
        {/* Checkmark */}
        <path
          d="M8 12.5l2.5 2.5L16 9"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

export default CheckIcon;