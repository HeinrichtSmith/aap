import React from 'react';

const PalletIcon = ({ adjustedSize, style = {}, className = "" }) => (
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
    <ellipse cx="40" cy="72" rx="28" ry="6" fill="rgba(0,0,0,0.25)" filter="blur(4px)" />
    
    <defs>
      <linearGradient id="palletWood" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8D6E63" />
        <stop offset="100%" stopColor="#5D4037" />
      </linearGradient>
      <linearGradient id="palletTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A1887F" />
        <stop offset="100%" stopColor="#8D6E63" />
      </linearGradient>
      <linearGradient id="palletHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
    </defs>
    
    {/* Pallet base planks */}
    <rect x="10" y="50" width="60" height="8" fill="url(#palletWood)" stroke="#3E2723" strokeWidth="2" rx="1" />
    <rect x="10" y="60" width="60" height="8" fill="#5D4037" stroke="#3E2723" strokeWidth="2" rx="1" />
    
    {/* Pallet supports */}
    <rect x="15" y="45" width="8" height="25" fill="#6D4C41" stroke="#3E2723" strokeWidth="2" />
    <rect x="36" y="45" width="8" height="25" fill="#6D4C41" stroke="#3E2723" strokeWidth="2" />
    <rect x="57" y="45" width="8" height="25" fill="#6D4C41" stroke="#3E2723" strokeWidth="2" />
    
    {/* Top planks */}
    <rect x="8" y="35" width="64" height="6" fill="url(#palletTop)" stroke="#3E2723" strokeWidth="2" rx="1" />
    <rect x="8" y="42" width="64" height="6" fill="url(#palletWood)" stroke="#3E2723" strokeWidth="2" rx="1" />
    
    {/* Wood grain details */}
    <line x1="12" y1="37" x2="68" y2="37" stroke="#3E2723" strokeWidth="0.5" opacity="0.3" />
    <line x1="12" y1="44" x2="68" y2="44" stroke="#3E2723" strokeWidth="0.5" opacity="0.3" />
    <line x1="12" y1="52" x2="68" y2="52" stroke="#3E2723" strokeWidth="0.5" opacity="0.3" />
    
    {/* Industrial markings */}
    <text x="40" y="28" textAnchor="middle" fill="#FF6F00" fontSize="8" fontWeight="bold">FREIGHT</text>
    
    {/* Glossy highlight */}
    <ellipse cx="40" cy="40" rx="25" ry="10" fill="url(#palletHighlight)" opacity="0.5" />
  </svg>
);

export default PalletIcon; 