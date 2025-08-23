// src/components/GameIcon.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTierBreakdown } from '../hooks/useTierBreakdown';
import { useStacking } from '../hooks/useStacking';
import { sizeMultipliers, getTierStyle, iconComponents } from '../config/gameIconConstants';
import QuantityBadge from './QuantityBadge';
import BreakdownTooltip from './BreakdownTooltip';

const GameIcon = ({ iconType, iconCount = 1, size = 80, iconSize = 'medium', actualQuantity, tier = null, showBadge = true, mixedIconTypes = null }) => {
  // Tier System:
  // 1-4: Normal brown boxes
  // 5-9: Blue tier (1 blue box per 5 items)
  // 10-24: Multiple blue boxes
  // 25-49: Gold tier (1 gold box per 25 items)
  // 50-124: Multiple gold boxes
  // 125-249: Purple tier (1 purple box per 125 items)
  // 250+: Cosmic tier (ultra rare rainbow boxes)
  
  // Use actualQuantity if provided, otherwise fall back to iconCount
  const quantity = actualQuantity || iconCount;
  
  // Calculate size based on iconSize prop
  const baseSizeMultiplier = sizeMultipliers[iconSize] || sizeMultipliers.medium;
  const adjustedSize = size * baseSizeMultiplier;
  
  // Get tier breakdown using custom hook or override with tier prop
  let { boxes, highestTier } = useTierBreakdown(quantity);
  const effectiveTier = tier || highestTier;
  
  // If tier is forced, override the boxes to match
  if (tier) {
    boxes = [{ count: 1, type: tier }];
  }
  
  
  // Get stacking configuration using custom hook
  const stackConfig = useStacking(boxes);
  
  // Get tier style configuration
  const tierStyle = getTierStyle(effectiveTier);
  
  // Determine the icon component(s) to render
  const IconComponent = iconComponents[iconType] || iconComponents.box;
  
  // Handle mixed icon types if provided
  const shouldUseMixedIcons = mixedIconTypes && mixedIconTypes.length > 0;
  const mixedComponents = shouldUseMixedIcons ? 
    mixedIconTypes.slice(0, 4).map(type => iconComponents[type] || iconComponents.box) : [];
  
  // Check for special effects
  const cosmicTier = effectiveTier === 'cosmic';
  const megaTier = effectiveTier === 'mega';

  return (
    <div className="relative inline-block">
      <motion.div 
        className={`relative w-24 h-24 flex items-center justify-center ${
          cosmicTier ? 'filter drop-shadow-2xl animate-pulse' : megaTier ? 'filter drop-shadow-2xl' : ''
        }`}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {/* Render stacked icons */}
        {stackConfig.map((config, index) => {
          // Use mixed icon components if available, cycling through them
          const CurrentIconComponent = shouldUseMixedIcons ? 
            mixedComponents[index % mixedComponents.length] : IconComponent;
            
          return (
            <motion.div
              key={index}
              className="absolute"
              style={{
                x: config.x,
                y: config.y,
                scale: config.scale,
                rotate: config.rotation,
                zIndex: config.zIndex
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: config.scale, 
                opacity: 1,
                rotate: config.rotation
              }}
              transition={{ 
                delay: index * 0.1, 
                type: "spring", 
                stiffness: 260, 
                damping: 20 
              }}
              whileHover={{ 
                y: config.y - 5,
                rotate: config.rotation + (Math.random() * 10 - 5),
                transition: { type: "spring", stiffness: 400 }
              }}
            >
              <CurrentIconComponent 
                adjustedSize={adjustedSize}
                isTierBox={true} // Always tier box for stacked items
                tierType={effectiveTier} // Always use effectiveTier
                tier={effectiveTier}
                size={adjustedSize}
                quantity={quantity}
              />
            </motion.div>
          );
        })}
      </motion.div>
      
      {/* Quantity badge */}
      {showBadge && (
        <QuantityBadge 
          quantity={quantity}
          tierStyle={tierStyle}
          megaTier={megaTier}
          cosmicTier={cosmicTier}
        />
      )}
      
      {/* Box breakdown tooltip */}
      <BreakdownTooltip boxes={boxes} />
    </div>
  );
};

export default GameIcon;