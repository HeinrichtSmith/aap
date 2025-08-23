export const MAX_QUANTITY = 300;

export const useTierSystem = (quantity) => {
  if (quantity >= 250) {
    // Cosmic tier (more accessible than 625)
    return {
      name: 'COSMIC',
      gradient: 'from-purple-900/30 via-pink-900/30 to-cyan-900/30',
      borderColor: 'border-cyan-500/60',
      shadow: 'shadow-cyan-500/30',
      hoverShadow: 'hover:shadow-cyan-500/35',
      hoverBorder: 'hover:border-cyan-500/70',
      badgeGradient: 'from-purple-600 via-pink-600 to-cyan-600',
      badgeShadow: 'shadow-cyan-500/50',
      animate: true
    };
  } else if (quantity >= 125) {
    // Mega tier (purple)
    return {
      name: 'MEGA',
      gradient: 'from-purple-900/30 via-pink-900/30 to-red-900/30',
      borderColor: 'border-pink-500/60',
      shadow: 'shadow-pink-500/30',
      hoverShadow: 'hover:shadow-pink-500/35',
      hoverBorder: 'hover:border-pink-500/70',
      badgeGradient: 'from-purple-600 via-pink-600 to-red-600',
      badgeShadow: 'shadow-pink-500/50',
      animate: true
    };
  } else if (quantity >= 25) {
    // Super tier (orange)
    return {
      name: 'SUPER',
      gradient: 'from-orange-900/25 to-orange-800/25',
      borderColor: 'border-orange-500/60',
      shadow: 'shadow-orange-500/25',
      hoverShadow: 'hover:shadow-orange-500/35',
      hoverBorder: 'hover:border-orange-500/70',
      badgeGradient: 'from-orange-500 to-orange-700',
      badgeShadow: 'shadow-orange-500/50'
    };
  } else if (quantity >= 5) {
    // Standard tier (blue)
    return {
      name: 'TIER',
      gradient: 'from-blue-900/25 to-blue-800/25',
      borderColor: 'border-blue-600/60',
      shadow: 'shadow-blue-500/25',
      hoverShadow: 'hover:shadow-blue-500/35',
      hoverBorder: 'hover:border-blue-600/70',
      badgeGradient: 'from-blue-500 to-blue-700',
      badgeShadow: 'shadow-blue-500/50'
    };
  } else if (quantity > 0) {
    // Normal (no tier)
    return {
      name: null,
      gradient: null,
      borderColor: 'border-blue-500/50',
      shadow: 'shadow-blue-500/20',
      hoverShadow: 'hover:shadow-blue-500/30',
      hoverBorder: 'hover:border-blue-500/60',
      badgeGradient: 'from-blue-400 to-blue-500',
      badgeShadow: 'shadow-blue-500/50'
    };
  }
  return null;
}; 