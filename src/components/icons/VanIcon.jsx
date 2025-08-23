import React from 'react';
import { motion } from 'framer-motion';

const VanIcon = ({ adjustedSize, style = {}, className = "", isTierBox = false, tierType = null }) => {
  const gradientId = isTierBox ? `vanGradient-tier-${tierType}-${Math.random()}` : `vanGradient-${Math.random()}`;
  const frontGradientId = isTierBox ? `vanFront-tier-${tierType}-${Math.random()}` : `vanFront-${Math.random()}`;
  
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
      <ellipse cx="40" cy="72" rx="32" ry="4" fill="rgba(0,0,0,0.3)" filter="blur(3px)" />
      
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
            ) : tierType === 'standard' ? (
              <>
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#E3F2FD" />
                <stop offset="100%" stopColor="#1976D2" />
              </>
            )
          ) : (
            <>
              <stop offset="0%" stopColor="#E3F2FD" />
              <stop offset="100%" stopColor="#1976D2" />
            </>
          )}
        </linearGradient>
        <linearGradient id={frontGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          {isTierBox ? (
            tierType === 'cosmic' ? (
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
            ) : tierType === 'standard' ? (
              <>
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="100%" stopColor="#60a5fa" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#BBDEFB" />
                <stop offset="100%" stopColor="#42A5F5" />
              </>
            )
          ) : (
            <>
              <stop offset="0%" stopColor="#BBDEFB" />
              <stop offset="100%" stopColor="#42A5F5" />
            </>
          )}
        </linearGradient>
        <linearGradient id="vanHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#424242" />
          <stop offset="50%" stopColor="#212121" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        {isTierBox && (tierType === 'mega' || tierType === 'cosmic') && (
          <radialGradient id={`van-glow-${Math.random()}`}>
            <stop offset="0%" stopColor={tierType === 'cosmic' ? "#22d3ee" : "#ec4899"} stopOpacity="0.8" />
            <stop offset="50%" stopColor={tierType === 'cosmic' ? "#e879f9" : "#a78bfa"} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      
      {/* Glow effect for mega tier and cosmic tier */}
      {isTierBox && (tierType === 'mega' || tierType === 'cosmic') && (
        <motion.ellipse
          cx="40"
          cy="45"
          rx="35"
          ry="20"
          fill={`url(#van-glow-${Math.random()})`}
          opacity="0.5"
          animate={{
            rx: [35, 40, 35],
            ry: [20, 25, 20],
            opacity: tierType === 'cosmic' ? [0.4, 0.8, 0.4] : [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: tierType === 'cosmic' ? 1.5 : 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Main van body (cargo area) */}
      <rect 
        x="15" 
        y="25" 
        width="50" 
        height="30" 
        rx="3" 
        fill={`url(#${gradientId})`}
        stroke="#0D47A1" 
        strokeWidth="2" 
        strokeLinejoin="round"
      />
      
      {/* Van front cab */}
      <path 
        d="M 15 35 L 8 35 L 8 50 L 15 50 Z" 
        fill={`url(#${frontGradientId})`}
        stroke="#0D47A1" 
        strokeWidth="2" 
        strokeLinejoin="round"
      />
      
      {/* Van roof */}
      <rect 
        x="8" 
        y="25" 
        width="57" 
        height="8" 
        rx="4" 
        fill={`url(#${gradientId})`}
        stroke="#0D47A1" 
        strokeWidth="2"
      />
      
      {/* Windshield */}
      <path 
        d="M 8 33 L 15 30 L 15 35 L 8 35 Z" 
        fill="#81D4FA" 
        stroke="#0277BD" 
        strokeWidth="1.5" 
        opacity="0.9"
      />
      
      {/* Side windows */}
      <rect x="18" y="28" width="12" height="8" rx="1" fill="#81D4FA" stroke="#0277BD" strokeWidth="1" opacity="0.8" />
      <rect x="35" y="28" width="12" height="8" rx="1" fill="#81D4FA" stroke="#0277BD" strokeWidth="1" opacity="0.8" />
      <rect x="52" y="28" width="10" height="8" rx="1" fill="#81D4FA" stroke="#0277BD" strokeWidth="1" opacity="0.8" />
      
      {/* Cargo doors */}
      <line x1="40" y1="25" x2="40" y2="55" stroke="#0D47A1" strokeWidth="2" />
      <line x1="53" y1="30" x2="53" y2="55" stroke="#0D47A1" strokeWidth="2" />
      
      {/* Door handles */}
      <circle cx="37" cy="42" r="1.5" fill="#FFD54F" stroke="#F57F17" strokeWidth="0.5" />
      <circle cx="56" cy="42" r="1.5" fill="#FFD54F" stroke="#F57F17" strokeWidth="0.5" />
      
      {/* Headlights */}
      <ellipse cx="6" cy="40" rx="2" ry="3" fill="#FFF9C4" stroke="#F57F17" strokeWidth="1" />
      <ellipse cx="6" cy="46" rx="2" ry="3" fill="#FFCDD2" stroke="#D32F2F" strokeWidth="1" />
      
      {/* Front wheels */}
      <circle cx="20" cy="58" r="6" fill="url(#wheelGradient)" stroke="#424242" strokeWidth="1" />
      <circle cx="20" cy="58" r="3" fill="#9E9E9E" />
      <circle cx="20" cy="58" r="1" fill="#E0E0E0" />
      
      {/* Rear wheels */}
      <circle cx="55" cy="58" r="6" fill="url(#wheelGradient)" stroke="#424242" strokeWidth="1" />
      <circle cx="55" cy="58" r="3" fill="#9E9E9E" />
      <circle cx="55" cy="58" r="1" fill="#E0E0E0" />
      
      {/* Company logo area */}
      <rect x="25" y="38" width="20" height="12" rx="2" fill="white" opacity="0.9" stroke="#0D47A1" strokeWidth="1" />
      <text x="35" y="45" textAnchor="middle" fill="#1976D2" fontSize="8" fontWeight="bold">DELIVERY</text>
      
      {/* Highlight effect */}
      <ellipse cx="35" cy="35" rx="25" ry="8" fill="url(#vanHighlight)" opacity="0.6" />
      
      {/* Loading bay indicator */}
      <rect x="62" y="48" width="2" height="6" fill="#4CAF50" rx="1" />
    </svg>
  );
};

export default VanIcon; 