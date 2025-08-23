import React from 'react';

const CartonIcon = ({ adjustedSize, style = {}, className = "", isTierBox = false, tierType = null }) => {
  const gradientId = isTierBox ? `cartonGradient-tier-${tierType}-${Math.random()}` : `cartonGradient-${Math.random()}`;
  
  return (
  <svg 
    width={adjustedSize} 
    height={adjustedSize} 
    viewBox="0 0 80 80" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={style}
    className={className}
  >
    {/* Shadow */}
    <ellipse cx="40" cy="70" rx="26" ry="6" fill="rgba(0,0,0,0.3)" filter="blur(4px)" />
    
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        {isTierBox ? (
          tierType === 'cosmic' ? (
            <>
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="20%" stopColor="#e879f9" />
              <stop offset="40%" stopColor="#fb7185" />
              <stop offset="60%" stopColor="#06b6d4" />
              <stop offset="80%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#e879f9" />
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                from="0 0.5 0.5"
                to="360 0.5 0.5"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </>
          ) : tierType === 'mega' ? (
            <>
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="33%" stopColor="#ec4899" />
              <stop offset="66%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#a78bfa" />
            </>
          ) : tierType === 'super' ? (
            <>
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#dc2626" />
            </>
          ) : tierType === 'standard' ? (
            <>
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#D7CCC8" />
              <stop offset="100%" stopColor="#A1887F" />
            </>
          )
        ) : (
          <>
            <stop offset="0%" stopColor="#D7CCC8" />
            <stop offset="100%" stopColor="#A1887F" />
          </>
        )}
      </linearGradient>
      <linearGradient id="cartonSide" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#BCAAA4" />
        <stop offset="100%" stopColor="#8D6E63" />
      </linearGradient>
      <linearGradient id="cartonHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
    </defs>
    
    {/* Main carton body */}
    <path 
      d="M 12 20 L 68 20 L 68 60 L 12 60 Z" 
      fill={`url(#${gradientId})`}
      stroke="#5D4037" 
      strokeWidth="3" 
      strokeLinejoin="round"
    />
    
    {/* Carton top flaps (sealed) */}
    <path 
      d="M 12 20 L 20 10 L 60 10 L 68 20" 
      fill="#D7CCC8" 
      stroke="#5D4037" 
      strokeWidth="3" 
      strokeLinejoin="round"
    />
    
    {/* Side panel */}
    <path 
      d="M 68 20 L 75 15 L 75 55 L 68 60 Z" 
      fill="url(#cartonSide)" 
      stroke="#5D4037" 
      strokeWidth="3" 
      strokeLinejoin="round"
    />
    
    {/* Sealing tape */}
    <rect x="5" y="15" width="70" height="8" fill="#795548" opacity="0.8" />
    <rect x="38" y="10" width="8" height="55" fill="#795548" opacity="0.8" />
    
    {/* Shipping label */}
    <rect x="20" y="35" width="35" height="20" fill="white" opacity="0.9" rx="2" stroke="#5D4037" strokeWidth="1" />
    <rect x="23" y="38" width="29" height="2" fill="#5D4037" />
    <rect x="23" y="42" width="20" height="2" fill="#5D4037" />
    <rect x="23" y="46" width="25" height="2" fill="#5D4037" />
    <text x="37" y="52" textAnchor="middle" fill="#D32F2F" fontSize="6" fontWeight="bold">HEAVY</text>
    
    {/* Glossy highlight */}
    <ellipse cx="35" cy="30" rx="20" ry="12" fill="url(#cartonHighlight)" opacity="0.6" />
  </svg>
  );
};

export default CartonIcon; 