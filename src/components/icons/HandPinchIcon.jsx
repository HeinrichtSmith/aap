import React from 'react';
import { getTierStyle } from '../../config/gameIconConstants';

const HandPinchIcon = ({ adjustedSize, isTierBox, tierType, tier, size, quantity }) => {
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
          <linearGradient id={`handGradient-${tier}-${quantity}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        
        {/* Hand Palm */}
        <path
          d="M8 10c0-1.5 1.5-3 3-3s3 1.5 3 3v3c0 .5.5 1 1 1s1-.5 1-1v-2c0-.5.5-1 1-1s1 .5 1 1v2c0 2-2 4-4 4h-4c-1.5 0-3-1.5-3-3v-1z"
          fill={`url(#handGradient-${tier}-${quantity})`}
          stroke={tierStyle.animate ? '#3b82f6' : '#1d4ed8'}
          strokeWidth="1.5"
        />
        
        {/* Thumb */}
        <path
          d="M11 9c0-1 .5-2 1.5-2s1.5 1 1.5 2v4"
          stroke={`url(#handGradient-${tier}-${quantity})`}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Fingers */}
        <path
          d="M14 8v4M16 9v3M18 10v2"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        
        {/* Pinch indication */}
        <circle
          cx="13"
          cy="6"
          r="1"
          fill="#fbbf24"
          className={tierStyle.animate ? 'animate-ping' : ''}
        />
      </svg>
    </div>
  );
};

export default HandPinchIcon;