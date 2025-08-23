import React from 'react';
import { motion } from 'framer-motion';

const TrophyIcon = ({ 
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
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      accent: '#C4B5FD',
      glow: '#8B5CF6'
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
      initial={isAnimated ? { scale: 0, y: 20 } : {}}
      animate={isAnimated ? { scale: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Glow effect for higher tiers */}
      {isHighTier && (
        <motion.div
          className="absolute inset-0 rounded-full blur-sm opacity-60"
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
        {/* Trophy base */}
        <motion.rect
          x="20"
          y="48"
          width="24"
          height="8"
          rx="2"
          fill={colors.primary}
          stroke={colors.accent}
          strokeWidth="1"
          initial={isAnimated ? { scaleY: 0 } : {}}
          animate={isAnimated ? { scaleY: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        {/* Trophy stem */}
        <motion.rect
          x="28"
          y="40"
          width="8"
          height="12"
          rx="1"
          fill={colors.secondary}
          stroke={colors.primary}
          strokeWidth="1"
          initial={isAnimated ? { scaleY: 0 } : {}}
          animate={isAnimated ? { scaleY: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
        />

        {/* Trophy cup main body */}
        <motion.path
          d="M 18 12 Q 18 8 22 8 L 42 8 Q 46 8 46 12 L 46 28 Q 46 36 32 36 Q 18 36 18 28 Z"
          fill={colors.secondary}
          stroke={colors.primary}
          strokeWidth="2"
          initial={isAnimated ? { pathLength: 0 } : {}}
          animate={isAnimated ? { pathLength: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        />

        {/* Trophy handles */}
        <motion.path
          d="M 12 16 Q 8 16 8 20 Q 8 24 12 24 L 18 24 L 18 16 Z"
          fill={colors.accent}
          stroke={colors.primary}
          strokeWidth="1.5"
          initial={isAnimated ? { pathLength: 0 } : {}}
          animate={isAnimated ? { pathLength: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        />
        <motion.path
          d="M 52 16 Q 56 16 56 20 Q 56 24 52 24 L 46 24 L 46 16 Z"
          fill={colors.accent}
          stroke={colors.primary}
          strokeWidth="1.5"
          initial={isAnimated ? { pathLength: 0 } : {}}
          animate={isAnimated ? { pathLength: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        />

        {/* Trophy interior highlight */}
        <motion.ellipse
          cx="32"
          cy="20"
          rx="8"
          ry="4"
          fill={colors.glow}
          opacity="0.3"
          initial={isAnimated ? { opacity: 0 } : {}}
          animate={isAnimated ? { opacity: 0.3 } : {}}
          transition={{ duration: 0.3, delay: 1.0 }}
        />

        {/* Level number or star */}
        <motion.g
          initial={isAnimated ? { scale: 0, rotate: -180 } : {}}
          animate={isAnimated ? { scale: 1, rotate: 0 } : {}}
          transition={{ type: "spring", stiffness: 300, delay: 1.2 }}
        >
          {quantity <= 10 ? (
            <motion.text
              x="32"
              y="28"
              fontSize="12"
              fill={colors.primary}
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              animate={isHighTier ? {
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8]
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {quantity}
            </motion.text>
          ) : (
            <motion.path
              d="M 32 16 L 34 24 L 42 24 L 36 28 L 38 36 L 32 32 L 26 36 L 28 28 L 22 24 L 30 24 Z"
              fill={colors.glow}
              stroke={colors.primary}
              strokeWidth="1"
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
          )}
        </motion.g>

        {/* Decorative elements on cup */}
        <motion.g
          initial={isAnimated ? { opacity: 0 } : {}}
          animate={isAnimated ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 1.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={i}
              cx={24 + i * 8}
              cy="12"
              r="1"
              fill={colors.accent}
              animate={isHighTier ? {
                opacity: [0.5, 1, 0.5],
                scale: [0.8, 1.2, 0.8]
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3
              }}
            />
          ))}
        </motion.g>

        {/* Achievement rank indicator */}
        {isHighTier && (
          <motion.g
            initial={isAnimated ? { scale: 0, rotate: -90 } : {}}
            animate={isAnimated ? { scale: 1, rotate: 0 } : {}}
            transition={{ type: "spring", stiffness: 200, delay: 1.6 }}
          >
            <motion.circle
              cx="50"
              cy="8"
              r="6"
              fill={colors.glow}
              stroke={colors.primary}
              strokeWidth="2"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.text
              x="50"
              y="10"
              fontSize="6"
              fill="white"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {tier === 'cosmic' ? '★' : tier === 'mega' ? '♦' : '▲'}
            </motion.text>
          </motion.g>
        )}

        {/* Confetti for cosmic tier */}
        {tier === 'cosmic' && (
          <motion.g
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.rect
                key={i}
                x={32 + Math.cos(i * Math.PI / 3) * 26}
                y={32 + Math.sin(i * Math.PI / 3) * 26}
                width="2"
                height="2"
                rx="1"
                fill={i % 2 === 0 ? colors.accent : colors.glow}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.5, 1.5, 0.5],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            ))}
          </motion.g>
        )}

        {/* Shine effect for mega tier */}
        {tier === 'mega' && (
          <motion.g
            animate={{
              x: [-20, 20],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.path
              d="M 25 10 L 27 10 L 39 34 L 37 34 Z"
              fill="white"
              opacity="0.6"
            />
          </motion.g>
        )}

        {/* Pulse effect for super tier */}
        {tier === 'super' && (
          <motion.circle
            cx="32"
            cy="24"
            r="20"
            fill="none"
            stroke={colors.glow}
            strokeWidth="1"
            opacity="0.3"
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </svg>
    </motion.div>
  );
};

export default TrophyIcon; 