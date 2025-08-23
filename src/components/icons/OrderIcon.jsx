import React from 'react';
import { motion } from 'framer-motion';

const OrderIcon = ({ 
  size = 32, 
  tier = 'normal', 
  quantity = 1, 
  className = '', 
  isAnimated = false 
}) => {
  const tierColors = {
    cosmic: {
      primary: '#FF6B9D',
      secondary: '#4ECDC4', 
      accent: '#FFE66D',
      glow: '#FF6B9D'
    },
    mega: {
      primary: '#FF9500',
      secondary: '#FFD700',
      accent: '#FF6B35',
      glow: '#FF9500'
    },
    super: {
      primary: '#fbbf24',
      secondary: '#f59e0b',
      accent: '#dc2626',
      glow: '#f59e0b'
    },
    standard: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      accent: '#93C5FD',
      glow: '#3B82F6'
    },
    normal: {
      primary: '#6B7280',
      secondary: '#9CA3AF',
      accent: '#D1D5DB',
      glow: '#6B7280'
    }
  };

  const colors = tierColors[tier];
  const isHighTier = ['cosmic', 'mega', 'super'].includes(tier);

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      initial={isAnimated ? { scale: 0, rotate: -180 } : {}}
      animate={isAnimated ? { scale: 1, rotate: 0 } : {}}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Glow effect for higher tiers */}
      {isHighTier && (
        <motion.div
          className="absolute inset-0 rounded-lg blur-sm opacity-60"
          style={{
            background: `radial-gradient(circle, ${colors.glow}40, transparent 70%)`,
            filter: 'blur(8px)',
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className="relative z-10"
      >
        {/* Document background */}
        <motion.rect
          x="8"
          y="6"
          width="48"
          height="52"
          rx="4"
          fill={colors.secondary}
          stroke={colors.primary}
          strokeWidth="2"
          initial={isAnimated ? { pathLength: 0 } : {}}
          animate={isAnimated ? { pathLength: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Document corner fold */}
        <motion.path
          d="M 44 6 L 44 18 L 56 18 L 56 10 Z"
          fill={colors.primary}
          stroke={colors.primary}
          strokeWidth="1"
          initial={isAnimated ? { opacity: 0 } : {}}
          animate={isAnimated ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.5 }}
        />

        {/* Order header section */}
        <motion.rect
          x="12"
          y="10"
          width="36"
          height="8"
          rx="2"
          fill={colors.primary}
          opacity="0.3"
          initial={isAnimated ? { scaleX: 0 } : {}}
          animate={isAnimated ? { scaleX: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        />

        {/* Order number */}
        <motion.text
          x="14"
          y="16"
          fontSize="6"
          fill={colors.primary}
          fontWeight="bold"
          initial={isAnimated ? { opacity: 0 } : {}}
          animate={isAnimated ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          SO-{String(quantity).padStart(4, '0')}
        </motion.text>

        {/* Order lines */}
        {[0, 1, 2, 3].map((i) => (
          <motion.g key={i}>
            <motion.rect
              x="12"
              y={22 + i * 6}
              width="32"
              height="2"
              rx="1"
              fill={colors.accent}
              initial={isAnimated ? { scaleX: 0 } : {}}
              animate={isAnimated ? { scaleX: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.9 + i * 0.1 }}
            />
            <motion.rect
              x="12"
              y={24 + i * 6}
              width="24"
              height="1.5"
              rx="0.5"
              fill={colors.secondary}
              initial={isAnimated ? { scaleX: 0 } : {}}
              animate={isAnimated ? { scaleX: 1 } : {}}
              transition={{ duration: 0.3, delay: 1.0 + i * 0.1 }}
            />
          </motion.g>
        ))}

        {/* Barcode */}
        <motion.g
          initial={isAnimated ? { opacity: 0, y: 5 } : {}}
          animate={isAnimated ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 1.4 }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <motion.rect
              key={i}
              x={14 + i * 2.6}
              y="48"
              width={i % 3 === 0 ? "2" : "1"}
              height="6"
              fill={colors.primary}
              animate={isHighTier ? {
                opacity: [0.7, 1, 0.7],
                scaleY: [0.9, 1.1, 0.9]
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </motion.g>

        {/* Status indicator */}
        <motion.circle
          cx="50"
          cy="24"
          r="3"
          fill={tier === 'normal' ? colors.accent : colors.glow}
          initial={isAnimated ? { scale: 0 } : {}}
          animate={isAnimated ? { scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 300, delay: 1.2 }}
        />

        {/* Quantity indicator for high tiers */}
        {quantity > 1 && isHighTier && (
          <motion.g
            initial={isAnimated ? { scale: 0, rotate: -90 } : {}}
            animate={isAnimated ? { scale: 1, rotate: 0 } : {}}
            transition={{ type: "spring", stiffness: 200, delay: 1.5 }}
          >
            <motion.circle
              cx="54"
              cy="10"
              r="8"
              fill={colors.glow}
              stroke={colors.primary}
              strokeWidth="2"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.text
              x="54"
              y="12"
              fontSize="8"
              fill="white"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {quantity > 99 ? '99+' : quantity}
            </motion.text>
          </motion.g>
        )}

        {/* Cosmic tier special effects */}
        {tier === 'cosmic' && (
          <motion.g
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.circle
                key={i}
                cx={32 + Math.cos(i * Math.PI / 2) * 28}
                cy={32 + Math.sin(i * Math.PI / 2) * 28}
                r="1.5"
                fill={i % 2 === 0 ? colors.accent : colors.glow}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            ))}
          </motion.g>
        )}
      </svg>
    </motion.div>
  );
};

export default OrderIcon; 