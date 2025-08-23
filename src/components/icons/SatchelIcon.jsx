import React from 'react';

const SatchelIcon = ({ adjustedSize, style = {}, className = "", isTierBox = false, tierType = null }) => {
  const gradientId = isTierBox ? `satchelGradient-tier-${tierType}-${Math.random()}` : `satchelGradient-${Math.random()}`;
  const flapGradientId = isTierBox ? `satchelFlap-tier-${tierType}-${Math.random()}` : `satchelFlap-${Math.random()}`;
  
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
      <ellipse cx="40" cy="72" rx="25" ry="5" fill="rgba(0,0,0,0.2)" filter="blur(3px)" />
      
      <defs>
        {isTierBox ? (
          <>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {tierType === 'cosmic' ? (
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
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </>
              ) : tierType === 'mega' ? (
                <>
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="33%" stopColor="#ec4899" />
                  <stop offset="66%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#a78bfa" />
                  <animateTransform
                    attributeName="gradientTransform"
                    type="rotate"
                    from="0 0.5 0.5"
                    to="360 0.5 0.5"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </>
              ) : tierType === 'super' ? (
                <>
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#dc2626" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </>
              )}
            </linearGradient>
            <linearGradient id={flapGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {tierType === 'cosmic' ? (
                <>
                  <stop offset="0%" stopColor="#e0e7ff" />
                  <stop offset="33%" stopColor="#fce7f3" />
                  <stop offset="66%" stopColor="#cffafe" />
                  <stop offset="100%" stopColor="#e0e7ff" />
                </>
              ) : tierType === 'mega' ? (
                <>
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="50%" stopColor="#f9a8d4" />
                  <stop offset="100%" stopColor="#fca5a5" />
                </>
              ) : tierType === 'super' ? (
                <>
                  <stop offset="0%" stopColor="#fde68a" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </>
              )}
            </linearGradient>
          </>
        ) : (
          <>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF5252" />
              <stop offset="100%" stopColor="#D32F2F" />
            </linearGradient>
            <linearGradient id={flapGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF8A80" />
              <stop offset="100%" stopColor="#FF5252" />
            </linearGradient>
          </>
        )}
        <linearGradient id="satchelHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      
      {/* Main envelope body */}
      <path 
        d="M 12 25 L 68 25 L 68 60 L 12 60 Z" 
        fill={`url(#${gradientId})`} 
        stroke={isTierBox ? "#fff" : "#8D0000"} 
        strokeWidth={isTierBox ? "4" : "3"} 
        strokeLinejoin="round"
      />
      
      {/* Envelope flap */}
      <path 
        d="M 12 25 L 40 45 L 68 25 Z" 
        fill={`url(#${flapGradientId})`} 
        stroke={isTierBox ? "#fff" : "#8D0000"} 
        strokeWidth={isTierBox ? "4" : "3"} 
        strokeLinejoin="round"
      />
      
      {/* Tier seal */}
      {isTierBox && (
        <circle cx="40" cy="35" r="12" fill="rgba(255,255,255,0.3)" />
      )}
      
      {/* Courier logo area */}
      <rect x="25" y="40" width="30" height="15" fill="white" opacity="0.9" rx="2" />
      <rect x="28" y="43" width="24" height="3" fill={isTierBox ? "#3b82f6" : "#FF5252"} rx="1" />
      <rect x="28" y="48" width="18" height="2" fill={isTierBox ? "#3b82f6" : "#FF5252"} rx="1" />
      
      {/* Glossy highlight */}
      <ellipse cx="35" cy="35" rx="18" ry="12" fill="url(#satchelHighlight)" opacity="0.6" />
    </svg>
  );
};

export default SatchelIcon; 