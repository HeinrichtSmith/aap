import React from 'react';
import { motion } from 'framer-motion';

const BoxIcon = ({ adjustedSize, style = {}, className = "", isTierBox = false, tierType = null }) => {
  const gradientId = isTierBox ? `boxGradient-tier-${tierType}-${Math.random()}` : `boxGradient-${Math.random()}`;
  const topGradientId = isTierBox ? `boxTop-tier-${tierType}-${Math.random()}` : `boxTop-${Math.random()}`;
  const ribbonGradientId = isTierBox ? `ribbon-tier-${tierType}-${Math.random()}` : `ribbon-${Math.random()}`;
  const ribbonShineId = isTierBox ? `ribbonShine-tier-${tierType}-${Math.random()}` : `ribbonShine-${Math.random()}`;
  
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
            <linearGradient id={topGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
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
            <linearGradient id={ribbonGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {tierType === 'cosmic' ? (
                <>
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="20%" stopColor="#f472b6" />
                  <stop offset="40%" stopColor="#fb923c" />
                  <stop offset="60%" stopColor="#22d3ee" />
                  <stop offset="80%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#f472b6" />
                  <animateTransform
                    attributeName="gradientTransform"
                    attributeType="XML"
                    type="rotate"
                    from="0 0.5 0.5"
                    to="360 0.5 0.5"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </>
              ) : tierType === 'mega' ? (
                <>
                  <stop offset="0%" stopColor="#e879f9" />
                  <stop offset="33%" stopColor="#fb7185" />
                  <stop offset="66%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#e879f9" />
                  <animateTransform
                    attributeName="gradientTransform"
                    attributeType="XML"
                    type="rotate"
                    from="0 0.5 0.5"
                    to="360 0.5 0.5"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </>
              ) : tierType === 'super' ? (
                <>
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="50%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </>
              )}
            </linearGradient>
            <linearGradient id={ribbonShineId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.5)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </>
        ) : (
          <>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB74D" />
              <stop offset="100%" stopColor="#F57C00" />
            </linearGradient>
            <linearGradient id={topGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFCC80" />
              <stop offset="100%" stopColor="#FFB74D" />
            </linearGradient>
          </>
        )}
        <linearGradient id="boxHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        {isTierBox && (tierType === 'mega' || tierType === 'cosmic') && (
          <radialGradient id={`rainbow-glow-${Math.random()}`}>
            <stop offset="0%" stopColor={tierType === 'cosmic' ? "#22d3ee" : "#ec4899"} stopOpacity="0.8" />
            <stop offset="50%" stopColor={tierType === 'cosmic' ? "#e879f9" : "#a78bfa"} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      
      {/* Glow effect for mega tier and cosmic tier */}
      {isTierBox && (tierType === 'mega' || tierType === 'cosmic') && (
        <motion.circle
          cx="40"
          cy="40"
          r="35"
          fill={`url(#rainbow-glow-${Math.random()})`}
          opacity="0.5"
          animate={{
            r: [35, 40, 35],
            opacity: tierType === 'cosmic' ? [0.4, 0.8, 0.4] : [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: tierType === 'cosmic' ? 1.5 : 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Main box body */}
      <path 
        d="M 15 30 L 65 30 L 65 65 L 15 65 Z" 
        fill={`url(#${gradientId})`} 
        stroke={isTierBox ? "#fff" : "#8D4E00"} 
        strokeWidth={isTierBox ? "4" : "3"} 
        strokeLinejoin="round"
      />
      
      {/* Box top */}
      <path 
        d="M 15 30 L 25 20 L 75 20 L 65 30 Z" 
        fill={`url(#${topGradientId})`} 
        stroke={isTierBox ? "#fff" : "#8D4E00"} 
        strokeWidth={isTierBox ? "4" : "3"} 
        strokeLinejoin="round"
      />
      
      {/* Box side */}
      <path 
        d="M 65 30 L 75 20 L 75 55 L 65 65 Z" 
        fill={isTierBox && tierType === 'cosmic' ? "#e879f9" : isTierBox && tierType === 'mega' ? "#7c3aed" : isTierBox && tierType === 'super' ? "#dc2626" : isTierBox ? "#2563eb" : "#E65100"} 
        stroke={isTierBox ? "#fff" : "#8D4E00"} 
        strokeWidth={isTierBox ? "4" : "3"} 
        strokeLinejoin="round"
      />
      
      {/* Enhanced 3D Ribbon for ALL boxes */}
      <>
        {/* Define ribbon colors */}
        <defs>
          <linearGradient id={`ribbon-regular-${Math.random()}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4FC3F7" />
            <stop offset="50%" stopColor="#29B6F6" />
            <stop offset="100%" stopColor="#0288D1" />
          </linearGradient>
          <linearGradient id={`ribbonShine-regular-${Math.random()}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        
        {/* Ribbon paths */}
        <path d="M 8 38 L 15 40 L 15 50 L 8 48 Z" fill={isTierBox ? `url(#${ribbonGradientId})` : `url(#ribbon-regular-${Math.random()})`} opacity="0.3" />
        <path d="M 15 40 L 22 42 L 22 48 L 15 50 Z" fill={isTierBox ? `url(#${ribbonGradientId})` : `url(#ribbon-regular-${Math.random()})`} opacity="0.6" />
        <path d="M 22 42 L 58 42 L 58 48 L 22 48 Z" fill={isTierBox ? `url(#${ribbonGradientId})` : `url(#ribbon-regular-${Math.random()})`} />
        <path d="M 22 42 L 58 42 L 58 44 L 22 44 Z" fill={isTierBox ? `url(#${ribbonShineId})` : `url(#ribbonShine-regular-${Math.random()})`} opacity="0.7" />
        <path d="M 22 46 L 58 46 L 58 48 L 22 48 Z" fill="rgba(0,0,0,0.2)" />
        <path d="M 58 42 L 65 40 L 65 50 L 58 48 Z" fill={isTierBox ? `url(#${ribbonGradientId})` : `url(#ribbon-regular-${Math.random()})`} opacity="0.7" />
        <path d="M 65 40 L 72 38 L 75 36 L 75 46 L 72 48 L 65 50 Z" fill={isTierBox ? `url(#${ribbonGradientId})` : `url(#ribbon-regular-${Math.random()})`} opacity="0.5" />
        <path d="M 75 36 L 78 38 L 78 48 L 75 46 Z" fill={isTierBox ? `url(#${ribbonGradientId})` : `url(#ribbon-regular-${Math.random()})`} opacity="0.2" />
        <path d="M 36 13 L 44 13 L 46 15 L 38 15 Z" fill={isTierBox ? `url(#${ribbonGradientId})` : `url(#ribbon-regular-${Math.random()})`} opacity="0.4" />
        <path d="M 38 15 L 46 15 L 46 22 L 38 22 Z" fill={isTierBox ? `url(#${ribbonGradientId})` : `url(#ribbon-regular-${Math.random()})`} opacity="0.6" />
        <path d="M 36 22 L 44 22 L 44 30 L 36 30 Z" fill={isTierBox ? `url(#${ribbonGradientId})` : `url(#ribbon-regular-${Math.random()})`} transform="skewY(-2)" />
        <path d="M 36 30 L 44 30 L 44 65 L 36 65 Z" fill={isTierBox ? `url(#${ribbonGradientId})` : `url(#ribbon-regular-${Math.random()})`} />
        <path d="M 36 30 L 38 30 L 38 65 L 36 65 Z" fill={isTierBox ? `url(#${ribbonShineId})` : `url(#ribbonShine-regular-${Math.random()})`} opacity="0.8" />
        <path d="M 42 30 L 44 30 L 44 65 L 42 65 Z" fill="rgba(0,0,0,0.2)" />
        <path d="M 36 65 L 44 65 L 44 70 L 36 70 Z" fill={isTierBox ? `url(#${ribbonGradientId})` : `url(#ribbon-regular-${Math.random()})`} opacity="0.3" />
        
        {/* Bow */}
        {isTierBox ? (
          <g transform="translate(40, 22)">
            <ellipse cx="-6" cy="0" rx="10" ry="6" fill={`url(#${ribbonGradientId})`} transform="rotate(-25 -6 0)" opacity="0.9" />
            <ellipse cx="6" cy="0" rx="10" ry="6" fill={`url(#${ribbonGradientId})`} transform="rotate(25 6 0)" opacity="0.9" />
            <ellipse cx="0" cy="0" rx="5" ry="4" fill={`url(#${ribbonGradientId})`} />
            <ellipse cx="0" cy="-1" rx="4" ry="3" fill={`url(#${ribbonShineId})`} opacity="0.6" />
            <path d="M -4 4 L -3 10 L -5 9 Z" fill={`url(#${ribbonGradientId})`} opacity="0.8" />
            <path d="M 4 4 L 3 10 L 5 9 Z" fill={`url(#${ribbonGradientId})`} opacity="0.8" />
          </g>
        ) : (
          <g transform="translate(40, 45)">
            <rect x="-4" y="-4" width="8" height="8" fill={`url(#ribbon-regular-${Math.random()})`} rx="1" />
            <rect x="-3" y="-3" width="6" height="6" fill={`url(#ribbonShine-regular-${Math.random()})`} opacity="0.5" rx="1" />
          </g>
        )}
      </>
      
      {/* Glossy highlight */}
      <ellipse cx="35" cy="35" rx="15" ry="10" fill="url(#boxHighlight)" opacity="0.7" />
    </svg>
  );
};

export default BoxIcon; 