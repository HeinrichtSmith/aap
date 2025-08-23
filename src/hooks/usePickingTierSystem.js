export const usePickingTierSystem = (currentQuantity, targetQuantity) => {
  const progress = currentQuantity / targetQuantity;
  const isComplete = currentQuantity >= targetQuantity;
  const isPartial = currentQuantity > 0 && currentQuantity < targetQuantity;

  if (isComplete) {
    // Complete - Green theme
    return {
      name: 'COMPLETE',
      gradient: 'from-green-900/30 to-emerald-900/30',
      borderColor: 'border-green-500/60',
      shadow: 'shadow-green-500/30',
      hoverShadow: 'hover:shadow-green-500/35',
      hoverBorder: 'hover:border-green-500/70',
      badgeGradient: 'from-green-500 to-emerald-500',
      badgeShadow: 'shadow-green-500/50',
      textColor: 'text-green-400',
      animate: true
    };
  } else if (isPartial) {
    // Partial - Yellow/Orange theme based on progress
    if (progress >= 0.75) {
      return {
        name: 'NEAR_COMPLETE',
        gradient: 'from-purple-900/25 to-purple-800/25',
        borderColor: 'border-purple-500/60',
        shadow: 'shadow-purple-500/25',
        hoverShadow: 'hover:shadow-purple-500/35',
        hoverBorder: 'hover:border-purple-500/70',
        badgeGradient: 'from-purple-500 to-purple-600',
        badgeShadow: 'shadow-purple-500/50',
        textColor: 'text-purple-400'
      };
    } else if (progress >= 0.5) {
      return {
        name: 'HALF_COMPLETE',
        gradient: 'from-purple-900/25 to-indigo-900/25',
        borderColor: 'border-purple-500/60',
        shadow: 'shadow-purple-500/25',
        hoverShadow: 'hover:shadow-purple-500/35',
        hoverBorder: 'hover:border-purple-500/70',
        badgeGradient: 'from-purple-500 to-indigo-500',
        badgeShadow: 'shadow-purple-500/50',
        textColor: 'text-purple-400'
      };
    } else {
      return {
        name: 'STARTED',
        gradient: 'from-blue-900/25 to-purple-900/25',
        borderColor: 'border-blue-500/60',
        shadow: 'shadow-blue-500/25',
        hoverShadow: 'hover:shadow-blue-500/35',
        hoverBorder: 'hover:border-blue-500/70',
        badgeGradient: 'from-blue-500 to-purple-500',
        badgeShadow: 'shadow-blue-500/50',
        textColor: 'text-blue-400'
      };
    }
  } else {
    // Not started - Default theme
    return {
      name: 'NOT_STARTED',
      gradient: null,
      borderColor: 'border-white/10',
      shadow: 'shadow-none',
      hoverShadow: 'hover:shadow-blue-500/20',
      hoverBorder: 'hover:border-blue-500/50',
      badgeGradient: null,
      badgeShadow: null,
      textColor: 'text-white'
    };
  }
};