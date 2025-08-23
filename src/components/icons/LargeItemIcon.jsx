import React from 'react';

const LargeItemIcon = ({ adjustedSize, style = {}, className = "" }) => (
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
    <ellipse cx="40" cy="70" rx="30" ry="7" fill="rgba(0,0,0,0.3)" filter="blur(5px)" />
    
    <defs>
      <linearGradient id="crateMain" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#78909C" />
        <stop offset="100%" stopColor="#455A64" />
      </linearGradient>
      <linearGradient id="crateMetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#90A4AE" />
        <stop offset="100%" stopColor="#607D8B" />
      </linearGradient>
      <linearGradient id="crateHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
    </defs>
    
    {/* Main crate body */}
    <path 
      d="M 10 25 L 70 25 L 70 65 L 10 65 Z" 
      fill="url(#crateMain)" 
      stroke="#263238" 
      strokeWidth="3" 
      strokeLinejoin="round"
    />
    
    {/* Crate top */}
    <path 
      d="M 10 25 L 20 15 L 80 15 L 70 25 Z" 
      fill="url(#crateMetal)" 
      stroke="#263238" 
      strokeWidth="3" 
      strokeLinejoin="round"
    />
    
    {/* Side panel */}
    <path 
      d="M 70 25 L 80 15 L 80 55 L 70 65 Z" 
      fill="#546E7A" 
      stroke="#263238" 
      strokeWidth="3" 
      strokeLinejoin="round"
    />
    
    {/* Metal reinforcements */}
    <rect x="8" y="35" width="64" height="4" fill="#37474F" />
    <rect x="8" y="50" width="64" height="4" fill="#37474F" />
    <rect x="25" y="20" width="4" height="50" fill="#37474F" />
    <rect x="51" y="20" width="4" height="50" fill="#37474F" />
    
    {/* Rivets */}
    <circle cx="15" cy="30" r="2" fill="#263238" />
    <circle cx="65" cy="30" r="2" fill="#263238" />
    <circle cx="15" cy="60" r="2" fill="#263238" />
    <circle cx="65" cy="60" r="2" fill="#263238" />
    
    {/* Warning signs */}
    <rect x="32" y="40" width="16" height="16" fill="#FFC107" rx="2" />
    <text x="40" y="50" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">!</text>
    
    {/* Shipping label */}
    <rect x="20" y="18" width="40" height="5" fill="white" opacity="0.9" />
    <text x="40" y="22" textAnchor="middle" fill="#D32F2F" fontSize="5" fontWeight="bold">OVERSIZED</text>
    
    {/* Glossy highlight */}
    <ellipse cx="40" cy="35" rx="25" ry="15" fill="url(#crateHighlight)" opacity="0.5" />
  </svg>
);

export default LargeItemIcon; 